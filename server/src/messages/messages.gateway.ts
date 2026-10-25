
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);

      if (!payload.sub) {
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    delete client.data.userId;
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { transactionId: string },
  ) {
    if (!client.data.userId) {
      client.disconnect();
      return { error: 'Unauthorized' };
    }

    await this.messagesService.findConversation(
      data.transactionId,
      client.data.userId,
    );

    client.join(`transaction:${data.transactionId}`);

    return {
      event: 'conversation_joined',
      data: { transactionId: data.transactionId },
    };
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    if (!client.data.userId) {
      return { error: 'Unauthorized' };
    }

    const message = await this.messagesService.create(
      data.transactionId,
      client.data.userId,
      data.content,
    );

    this.server
      .to(`transaction:${data.transactionId}`)
      .emit('new_message', message);

    return { success: true, message };
  }
}
