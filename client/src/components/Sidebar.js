import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    {
      icon: '📊',
      label: 'Dashboard',
      path: '/dashboard',
      badge: null
    },
    {
      icon: '📅',
      label: 'Mis Citas',
      path: '/appointments',
      badge: null
    },
    {
      icon: '👥',
      label: 'Pacientes',
      path: '/patients',
      badge: null
    },
    {
      icon: '⏰',
      label: 'Disponibilidad',
      path: '/availability',
      badge: null
    },
    {
      icon: '📈',
      label: 'Reportes',
      path: '/reports',
      badge: null
    },
    {
      icon: '⚙️',
      label: 'Configuración',
      path: '/settings',
      badge: null
    }
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        {!isCollapsed && <h2 className={styles.title}>🏥 Panel</h2>}
        <button
          className={styles.toggleBtn}
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.menu}>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.menuItem} ${isActive ? styles.active : ''}`
                }
                title={isCollapsed ? item.label : ''}
              >
                <span className={styles.icon}>{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className={styles.label}>{item.label}</span>
                    {item.badge && (
                      <span className={styles.badge}>{item.badge}</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div
          className={styles.help}
          title="Centro de ayuda"
        >
          <span className={styles.icon}>❓</span>
          {!isCollapsed && <span className={styles.label}>Ayuda</span>}
        </div>
      </div>
    </aside>
  );
}
