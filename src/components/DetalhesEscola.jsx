// src/components/DetalhesEscola.jsx

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import styles from "../components/DetalhesEscola.module.css";
import painelStyles from "../components/PainelPrincipal.module.css";

export default function DetalhesEscola({ escola, onVoltar }) {
  const [user, setUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário de resultados
  const [avaliacao, setAvaliacao] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [serie, setSerie] = useState("");
  const [valorIndice, setValorIndice] = useState("");
  const [disciplina, setDisciplina] = useState("");

  // UID do admin (fixo)
  const ADMIN_UID = "e55942f2-87c9-4811-9a0b-0841e8a39733";

  // 🔐 Busca o usuário logado e define permissões
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Erro ao obter usuário:", error.message);
        return;
      }

      setUser(user);
      setCanEdit(user?.id === ADMIN_UID);
    }
    getUser();
  }, []);

  // 🔍 Busca os resultados da escola
  async function fetchResultados() {
    setLoading(true);
    const { data, error } = await supabase
      .from("resultados")
      .select("*")
      .eq("escola_id", escola.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setResultados(data);
    } else {
      alert("Erro ao buscar resultados: " + error.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchResultados();
  }, [escola.id]);

  // ➕ Adicionar resultado (apenas admin)
  const handleAddResultado = async (e) => {
    e.preventDefault();
    if (!canEdit)
      return alert("Apenas o administrador pode adicionar resultados.");
    if (!avaliacao || !ano || !serie || !valorIndice || !disciplina) {
      alert("Por favor, preencha todos os campos do resultado.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("resultados").insert({
      escola_id: escola.id,
      avaliacao,
      ano: parseInt(ano),
      serie,
      valor_indice: parseFloat(valorIndice),
      disciplina,
    });

    if (error) {
      alert("Erro ao salvar resultado: " + error.message);
    } else {
      alert("Resultado salvo com sucesso!");
      setAvaliacao("");
      setAno(new Date().getFullYear());
      setSerie("");
      setValorIndice("");
      setDisciplina("");
      fetchResultados();
    }
    setLoading(false);
  };

  // ❌ Deletar resultado (apenas admin)
  const handleDeleteResultado = async (resultadoId) => {
    if (!canEdit)
      return alert("Apenas o administrador pode deletar resultados.");
    setLoading(true);
    try {
      const { error } = await supabase
        .from("resultados")
        .delete()
        .eq("id", resultadoId);

      if (error) throw error;

      setResultados(resultados.filter((r) => r.id !== resultadoId));
    } catch (error) {
      alert("Erro ao deletar resultado: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onVoltar} className={styles.voltarButton}>
          &larr; Voltar
        </button>
        <h1>{escola.nome_escola}</h1>
        <small>INEP: {escola.codigo_inep}</small>
      </div>

      <div className={painelStyles.contentRow}>
        {/* ✅ Formulário aparece somente se for o admin */}
        {canEdit && (
          <form onSubmit={handleAddResultado} className={styles.cardForm}>
            <h3>Adicionar Novo Resultado</h3>
            <input
              type="text"
              placeholder="Nome da Avaliação (ex: SAEB, Prova Brasil)"
              value={avaliacao}
              onChange={(e) => setAvaliacao(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Disciplina (ex: Português, Matemática)"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              className={styles.input}
            />
            <input
              type="number"
              placeholder="Ano"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Série (ex: 5º Ano, 9º Ano)"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className={styles.input}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor/Índice (ex: 5.75)"
              value={valorIndice}
              onChange={(e) => setValorIndice(e.target.value)}
              className={styles.input}
            />
            <button
              type="submit"
              disabled={loading}
              className={styles.addButton}
            >
              {loading ? "Salvando..." : "Adicionar Resultado"}
            </button>
          </form>
        )}

        {/* 📊 Lista de Resultados */}
        <div className={canEdit ? styles.cardList : styles.cardListFullWidth}>
          <h3>Resultados Cadastrados</h3>
          {loading && <p>Carregando...</p>}
          <ul className={styles.list}>
            {resultados.length > 0
              ? resultados.map((r) => (
                  <li key={r.id} className={styles.listItem}>
                    <div className={styles.resultadoInfo}>
                      <span>
                        <strong>
                          {r.disciplina} - {r.avaliacao}
                        </strong>
                        <small>
                          {r.ano} - {r.serie}
                        </small>
                      </span>
                      <span className={styles.indiceValor}>
                        {r.valor_indice ? r.valor_indice.toFixed(2) : "N/A"}
                      </span>
                    </div>

                    {/* ❌ Botão Deletar só para admin */}
                    {canEdit && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteResultado(r.id)}
                        disabled={loading}
                      >
                        Deletar
                      </button>
                    )}
                  </li>
                ))
              : !loading && (
                  <p>Nenhum resultado cadastrado para esta escola.</p>
                )}
          </ul>
        </div>
      </div>
    </div>
  );
}
