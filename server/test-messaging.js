
const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';
const TRANSACTION_ID = 'YOUR_TRANSACTION_ID';
const TOKEN_A = 'FIRST_USER_ACCESS_TOKEN';
const TOKEN_B = 'SECOND_USER_ACCESS_TOKEN';

const userA = io(URL, {
  auth: { token: TOKEN_A },
});

const userB = io(URL, {
  auth: { token: TOKEN_B },
});

userA.on('connect', () => {
  console.log('User A connected:', userA.id);
  userA.emit('join_conversation', {
    transactionId: TRANSACTION_ID,
  });
});

userB.on('connect', () => {
  console.log('User B connected:', userB.id);
  userB.emit('join_conversation', {
    transactionId: TRANSACTION_ID,
  });
});

userA.on('connect_error', (error) => {
  console.log('User A connection error:', error.message);
});

userB.on('connect_error', (error) => {
  console.log('User B connection error:', error.message);
});

userA.on('conversation_joined', (data) => {
  console.log('User A joined:', data);
});

userB.on('conversation_joined', (data) => {
  console.log('User B joined:', data);
});

userB.on('new_message', (message) => {
  console.log('User B received a real-time message:', message);
  userA.disconnect();
  userB.disconnect();
  process.exit(0);
});

setTimeout(() => {
  console.log('Sending test message...');
  userA.emit('send_message', {
    transactionId: TRANSACTION_ID,
    content: 'Real-time messaging test',
  });
}, 2000);

setTimeout(() => {
  console.log('Test timed out. Check connection and room membership.');
  userA.disconnect();
  userB.disconnect();
  process.exit(1);
}, 10000);
