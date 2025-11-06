import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
// 1. Importa o CSS Module
import styles from "./GerenciarEscolas.module.css";

export default function GerenciarEscolas() {
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para o novo formulário
  const [nomeEscola, setNomeEscola] = useState("");
  const [emailEscola, setEmailEscola] = useState("");
  const [senhaEscola, setSenhaEscola] = useState("");

  const fetchEscolas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("escolas")
      .select("id, nome_escola, codigo_inep")
      .order("nome_escola", { ascending: true });

    if (!error) {
      setEscolas(data);
    } else {
      alert("Erro ao buscar escolas: " + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEscolas();
  }, []);

  const handleAddEscola = async (e) => {
    e.preventDefault();
    if (!nomeEscola || !emailEscola || !senhaEscola) {
      alert("Por favor, preencha nome, email e senha da escola.");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Cria o usuário no Supabase Auth
      const { data: userData, error: signUpError } =
        await supabase.auth.admin.createUser({
          email: emailEscola,
          password: senhaEscola,
          email_confirm: true, // pula verificação de e-mail
          user_metadata: { tipo: "escola" },
        });

      if (signUpError) throw signUpError;

      const newUserId = userData.user.id;

      // 2️⃣ Cria a escola vinculada a esse usuário
      const { error: insertError } = await supabase.from("escolas").insert({
        nome_escola: nomeEscola,
        user_id: newUserId,
      });

      if (insertError) throw insertError;

      alert("Escola e usuário criados com sucesso!");
      setNomeEscola("");
      setEmailEscola("");
      setSenhaEscola("");
      fetchEscolas();
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEscola = async (escolaId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta escola?")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("escolas")
        .delete()
        .eq("id", escolaId);
      if (error) throw error;
      setEscolas(escolas.filter((escola) => escola.id !== escolaId));
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 2. Usa 'className' para o container (não mais 'style')
    <div className={styles.container}>
      <h3>Gerenciamento de Unidades Escolares</h3>

      {/* 3. Usa 'className' para o formulário e inputs */}
      <form onSubmit={handleAddEscola} className={styles.form}>
        <h4>Cadastrar Nova Escola (e seu Login)</h4>
        <input
          type="text"
          placeholder="Nome da nova escola"
          value={nomeEscola}
          onChange={(e) => setNomeEscola(e.target.value)}
          className={styles.input}
        />
        <input
          type="email"
          placeholder="Email de login da escola"
          value={emailEscola}
          onChange={(e) => setEmailEscola(e.target.value)}
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Senha de login da escola"
          value={senhaEscola}
          onChange={(e) => setSenhaEscola(e.target.value)}
          className={styles.input}
        />
        <button type="submit" disabled={loading} className={styles.addButton}>
          {loading ? "Salvando..." : "Criar Escola e Login"}
        </button>
      </form>

      {/* 4. Usa 'className' para a lista */}
      <h4>Escolas Cadastradas:</h4>
      {loading && <p>Carregando lista...</p>}
      <ul className={styles.list}>
        {escolas.length > 0
          ? escolas.map((escola) => (
              <li key={escola.id} className={styles.listItem}>
                <span>{escola.nome_escola}</span>
                <button
                  onClick={() => handleDeleteEscola(escola.id)}
                  className={styles.deleteButton}
                  disabled={loading}
                >
                  Deletar
                </button>
              </li>
            ))
          : !loading && <p>Nenhuma escola cadastrada ainda.</p>}
      </ul>
    </div>
  );
}
