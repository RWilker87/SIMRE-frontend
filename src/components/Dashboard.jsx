import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function GerenciarEscolas() {
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para o novo formulário
  const [nomeEscola, setNomeEscola] = useState("");
  const [emailEscola, setEmailEscola] = useState("");
  const [senhaEscola, setSenhaEscola] = useState("");

  // 1. Buscar as escolas já cadastradas (isto deve funcionar agora)
  const fetchEscolas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("escolas")
      .select("id, nome_escola, codigo_inep")
      .order("nome_escola", { ascending: true });

    if (!error) {
      setEscolas(data);
    } else {
      // O erro 'tabela não existe' não deve mais aparecer
      alert("Erro ao buscar escolas: " + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEscolas();
  }, []); // O [] vazio faz rodar só uma vez

  // 2. Função para ADICIONAR uma nova escola (usando a Função SQL)
  const handleAddEscola = async (e) => {
    e.preventDefault();
    if (!nomeEscola || !emailEscola || !senhaEscola) {
      alert("Por favor, preencha nome, email e senha da escola.");
      return;
    }

    try {
      setLoading(true);
      // Chama a função 'criar_escola_com_usuario' que criamos no SQL Editor
      const { data, error } = await supabase.rpc("criar_escola_com_usuario", {
        _nome_escola: nomeEscola,
        _email: emailEscola,
        _password: senhaEscola,
        // _codigo_inep: '12345' // (Opcional) Você pode adicionar um campo para isso
      });

      if (error) throw error;

      alert("Escola e usuário criados com sucesso!");

      // Limpa os campos
      setNomeEscola("");
      setEmailEscola("");
      setSenhaEscola("");

      // Recarrega a lista de escolas
      fetchEscolas();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Função para DELETAR uma escola (ainda funciona)
  const handleDeleteEscola = async (escolaId) => {
    // (Aviso: Isto só deleta a escola, não o usuário de login.
    //  Uma função de 'deletar_escola_completa' seria necessária no futuro)
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
    <div
      style={{
        marginTop: "20px",
        borderTop: "2px solid #eee",
        paddingTop: "20px",
      }}
    >
      <h3>Gerenciamento de Unidades Escolares</h3>

      {/* Formulário para adicionar nova escola */}
      <form onSubmit={handleAddEscola} style={styles.form}>
        <h4>Cadastrar Nova Escola (e seu Login)</h4>
        <input
          type="text"
          placeholder="Nome da nova escola"
          value={nomeEscola}
          onChange={(e) => setNomeEscola(e.target.value)}
          style={styles.input}
        />
        <input
          type="email"
          placeholder="Email de login da escola"
          value={emailEscola}
          onChange={(e) => setEmailEscola(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Senha de login da escola"
          value={senhaEscola}
          onChange={(e) => setSenhaEscola(e.target.value)}
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.addButton}>
          {loading ? "Salvando..." : "Criar Escola e Login"}
        </button>
      </form>

      {/* Lista de escolas cadastradas */}
      <h4>Escolas Cadastradas:</h4>
      {loading && <p>Carregando lista...</p>}
      <ul style={styles.list}>
        {escolas.length > 0
          ? escolas.map((escola) => (
              <li key={escola.id} style={styles.listItem}>
                <span>{escola.nome_escola}</span>
                <button
                  onClick={() => handleDeleteEscola(escola.id)}
                  style={styles.deleteButton}
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
