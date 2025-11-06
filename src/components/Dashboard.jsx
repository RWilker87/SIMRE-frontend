import { useState } from "react";
import { supabase } from "../supabaseClient";
import GerenciarEscolas from "./GerenciarEscolas.jsx";
import styles from "./Dashboard.module.css"; // CSS para este painel

export default function Dashboard({ session }) {
  const [loading, setLoading] = useState(false);

  // 1. Função de Logout (com 'try...catch' corrigido)
  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // O App.jsx vai detectar o logout
    } catch (error) {
      // <-- A CHAVE { ESTAVA FALTANDO AQUI
      alert(error.error_description || error.message);
    } finally {
      // <-- A CHAVE } ESTAVA FALTANDO AQUI
      setLoading(false);
    }
  };

  return (
    // 2. Este 'container' define a largura do seu painel
    <div className={styles.container}>
      {/* 3. Header com email e botão Sair */}
      <header className={styles.header}>
        <div className={styles.welcome}>
          Logado como: <strong>{session.user.email}</strong>
        </div>
        <button
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Saindo..." : "Sair"}
        </button>
      </header>

      {/* 4. Renderiza o gerenciador de escolas abaixo */}
      <GerenciarEscolas />
    </div>
  );
}
