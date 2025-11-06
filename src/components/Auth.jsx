// src/components/Auth.jsx (Atualizado)

import { useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "./Auth.module.css"; // Importa o CSS Module

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Apenas a função de Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // O App.jsx vai detectar o login e mudar a tela
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>SIMRE - Login</h1>
      <p>Sistema Municipal de Resultados Educacionais</p>
      <form className={styles.form} onSubmit={handleLogin}>
        <input
          className={styles.input}
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Carregando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
