"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../state/AuthProvider";
import { api } from "../lib/api";

export default function Topbar() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();

  const isActive = (href: string) => path === href;

  return (
    <div className="topbarNav">
      <div className="topbarBrand">
        <div className="brandDot" />
        <div className="brandTitle">ROLETA</div>
        {user && <span className="brandBadge">{user.role.toUpperCase()}</span>}
      </div>

      <nav className="topbarMenu">
        <Link 
          className={`navLink ${isActive("/app") ? "active" : ""}`} 
          href="/app"
          title="Ir para o sistema de roleta"
        >
          <span className="navIcon">🎰</span>
          <span className="navText">Sistema</span>
        </Link>

        <Link 
          className={`navLink ${isActive("/profile") ? "active" : ""}`} 
          href="/profile"
          title="Acessar seu perfil"
        >
          <span className="navIcon">👤</span>
          <span className="navText">Perfil</span>
        </Link>

        {user?.role === "admin" && (
          <>
            <Link 
              className={`navLink ${isActive("/admin/users") ? "active" : ""}`} 
              href="/admin/users"
              title="Gerenciar usuários"
            >
              <span className="navIcon">👤</span>
              <span className="navText">Usuários</span>
            </Link>
            <Link 
              className={`navLink ${isActive("/admin/strategies") ? "active" : ""}`} 
              href="/admin/strategies"
              title="Gerenciar estratégias"
            >
              <span className="navIcon">⚙️</span>
              <span className="navText">777 Config</span>
            </Link>
          </>
        )}

        <button
          className="navLink navLogout"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          title="Sair do sistema"
        >
          <span className="navIcon">🚪</span>
          <span className="navText">Sair</span>
        </button>
      </nav>

      <div className="topbarUser">
        {user && <span className="userInfo">Olá, {user.name}</span>}
      </div>
    </div>
  );
}
