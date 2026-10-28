
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getNotifications, type AppNotification } from '../services/api';

const menus = [
  {
    label: 'Listings',
    items: [
      { to: '/listings', label: 'Browse Listings' },
      { to: '/listings/new', label: 'Create Listing' },
      { to: '/my-listings', label: 'My Listings' },
    ],
  },
  {
    label: 'Offers',
    items: [
      { to: '/offers/sent', label: 'Sent Offers' },
      { to: '/offers/received', label: 'Received Offers' },
    ],
  },
  {
    label: 'Transactions',
    items: [{ to: '/transactions', label: 'My Transactions' }],
  },
];

export default function Navbar() {
  const { token, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
const [openDropdown, setOpenDropdown] = useState<string | null>(null);


  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    getNotifications(token)
      .then((notifications: AppNotification[]) => {
        if (!cancelled) {
          setUnreadCount(
            notifications.filter((notification) => !notification.isRead).length,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [token, location.pathname]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setExpandedMenu(null);
  setOpenDropdown(null);

  };

  const handleLogout = () => {
    signOut();
    closeMenus();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-emerald-100 text-emerald-800'
        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
    }`;

  const dropdownLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-3 text-sm transition-colors ${
      isActive
        ? 'bg-emerald-50 font-semibold text-emerald-800'
        : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-800'
    }`;

  const menuIsActive = (items: { to: string; label: string }[]) =>
    items.some((item) => location.pathname === item.to);

  const renderDropdown = (
    label: string,
    children: ReactNode,
    active: boolean,
  ) => (
    <div key={label} className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          active
            ? 'bg-emerald-100 text-emerald-800'
            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
        }`}
      >
        {label}
        <span className="text-xs transition-transform group-hover:rotate-180">
          ▾
        </span>
      </button>

      <div className="invisible absolute left-0 top-full z-50 w-52 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/60">
          {children}
        </div>
      </div>
    </div>
  );

  const notificationLink = (
    <NavLink
      to="/notifications"
      onClick={closeMenus}
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      title="Notifications"
      className={({ isActive }) =>
        `relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
          isActive
            ? 'bg-emerald-100 text-emerald-800'
            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
        }`
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
        />
      </svg>

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </NavLink>
  );

  const accountMenu = (
    <>
      <NavLink
        to="/profile"
        className={dropdownLinkClass}
        onClick={closeMenus}
      >
        <span className="mr-2">👤</span>
        My Profile
      </NavLink>

      <button
        type="button"
        onClick={handleLogout}
        className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <span className="mr-2">↪</span>
        Log out
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={closeMenus}
          className="flex min-w-0 items-center gap-2"
          aria-label="Repair and Swap Circle homepage"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
            ♻️
          </span>
          <span className="text-base font-extrabold tracking-tight text-emerald-900 sm:text-lg">
            Repair &amp; Swap Circle
          </span>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          {token && notificationLink}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="rounded-xl p-2 text-gray-700 transition hover:bg-emerald-50"
          >
            <span className="text-2xl">
              {mobileMenuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>

          {token ? (
            <>
              <NavLink to="/dashboard" className={linkClass} end>
                Dashboard
              </NavLink>

              {menus.map((menu) =>
                renderDropdown(
                  menu.label,
                  menu.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end
                      className={dropdownLinkClass}
                    >
                      {item.label}
                    </NavLink>
                  )),
                  menuIsActive(menu.items),
                ),
              )}

              {renderDropdown(
                'Account',
                accountMenu,
                location.pathname === '/profile',
              )}

              <div className="ml-1">{notificationLink}</div>
            </>
          ) : (
            <>
              <NavLink to="/listings" className={linkClass}>
                Browse
              </NavLink>

              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Create Account
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-emerald-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <NavLink
              to="/"
              className={linkClass}
              end
              onClick={closeMenus}
            >
              Home
            </NavLink>

            {token ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={linkClass}
                  end
                  onClick={closeMenus}
                >
                  Dashboard
                </NavLink>

                {menus.map((menu) => (
                  <div key={menu.label}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMenu((current) =>
                          current === menu.label ? null : menu.label,
                        )
                      }
                      aria-expanded={expandedMenu === menu.label}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        menuIsActive(menu.items)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'text-gray-600 hover:bg-emerald-50'
                      }`}
                    >
                      {menu.label}
                      <span>
                        {expandedMenu === menu.label ? '▴' : '▾'}
                      </span>
                    </button>

                    {expandedMenu === menu.label && (
                      <div className="ml-3 mt-1 border-l-2 border-emerald-100 py-1 pl-2">
                        {menu.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            className={dropdownLinkClass}
                            onClick={closeMenus}
                          >
                            {item.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="my-2 border-t border-gray-100" />

                <NavLink
                  to="/profile"
                  className={linkClass}
                  onClick={closeMenus}
                >
                  👤 My Profile
                </NavLink>

                <NavLink
                  to="/notifications"
                  className={linkClass}
                  onClick={closeMenus}
                >
                  🔔 Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  ↪ Log out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/listings"
                  className={linkClass}
                  onClick={closeMenus}
                >
                  Browse
                </NavLink>

                <NavLink
                  to="/login"
                  className={linkClass}
                  onClick={closeMenus}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className="rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                  onClick={closeMenus}
                >
                  Create Account
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
