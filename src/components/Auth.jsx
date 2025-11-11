// src/components/Auth.jsx (Totalmente atualizado)

import { useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "./Auth.module.css"; // Importa o CSS Module
import logo from "../assets/logo.png"; // Importa a logo da pasta /public

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // A função de Login (continua a mesma)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // O body (em index.css) já centraliza este container
    <div className={styles.container}>
      {/* O card branco */}
      <div className={styles.card}>
        <img src={logo} alt="SIMRE Logo" className={styles.logo} />
        <p className={styles.subtitle}>
          Sistema Integrado de Monitoramento de Recursos
        </p>

        <form className={styles.form} onSubmit={handleLogin}>
          {/* Campo de E-mail com Label */}
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Campo de Senha com Label */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Carregando..." : "Entrar"}
          </button>
        </form>
      </div>

      {/* Rodapé */}
      <footer className={styles.footer}>
        <p>© 2025 SIMRE. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
