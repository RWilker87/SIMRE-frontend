// src/components/DetalhesEscola.jsx (Corrigido com "disciplina")

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./DetalhesEscola.module.css";
import painelStyles from "./PainelPrincipal.module.css";

export default function DetalhesEscola({ escola, onVoltar }) {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário de resultados
  const [avaliacao, setAvaliacao] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [serie, setSerie] = useState("");
  const [valorIndice, setValorIndice] = useState("");
  // --- 1. ADICIONAR ESTADO PARA DISCIPLINA ---
  const [disciplina, setDisciplina] = useState("");

  // Função para buscar os resultados existentes
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

  // Busca os dados quando o componente é carregado
  useEffect(() => {
    fetchResultados();
  }, [escola.id]);

  // Função para adicionar um novo resultado
  const handleAddResultado = async (e) => {
    e.preventDefault();
    // --- 2. ATUALIZAR VALIDAÇÃO ---
    if (!avaliacao || !ano || !serie || !valorIndice || !disciplina) {
      alert("Por favor, preencha todos os campos do resultado.");
      return;
    }

    setLoading(true);
    // --- 3. ATUALIZAR INSERT ---
    const { error } = await supabase.from("resultados").insert({
      escola_id: escola.id,
      avaliacao: avaliacao,
      ano: parseInt(ano),
      serie: serie,
      valor_indice: parseFloat(valorIndice),
      disciplina: disciplina, // <-- CAMPO ADICIONADO
    });

    if (error) {
      alert("Erro ao salvar resultado: " + error.message);
    } else {
      alert("Resultado salvo com sucesso!");
      // Limpa o formulário
      setAvaliacao("");
      setAno(new Date().getFullYear());
      setSerie("");
      setValorIndice("");
      setDisciplina(""); // <-- 4. LIMPAR NOVO CAMPO
      // Atualiza a lista de resultados
      fetchResultados();
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onVoltar} className={styles.voltarButton}>
          &larr; Voltar para a lista
        </button>
        <h1>{escola.nome_escola}</h1>
        <small>INEP: {escola.codigo_inep}</small>
      </div>

      {/* Usar o mesmo grid de 2 colunas do painel */}
      <div className={painelStyles.contentRow}>
        {/* Card 1: Formulário para Adicionar Resultado */}
        <form onSubmit={handleAddResultado} className={styles.cardForm}>
          <h3>Adicionar Novo Resultado</h3>
          <input
            type="text"
            placeholder="Nome da Avaliação (ex: SAEB, Prova Brasil)"
            value={avaliacao}
            onChange={(e) => setAvaliacao(e.target.value)}
            className={styles.input}
          />
          {/* --- 5. ADICIONAR NOVO INPUT DE DISCIPLINA --- */}
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
            step="0.01" // Permite casas decimais
            placeholder="Valor/Índice (ex: 5.75)"
            value={valorIndice}
            onChange={(e) => setValorIndice(e.target.value)}
            className={styles.input}
          />
          <button type="submit" disabled={loading} className={styles.addButton}>
            {loading ? "Salvando..." : "Adicionar Resultado"}
          </button>
        </form>

        {/* Card 2: Lista de Resultados Existentes */}
        <div className={styles.cardList}>
          <h3>Resultados Cadastrados</h3>
          {loading && <p>Carregando...</p>}
          <ul className={styles.list}>
            {resultados.length > 0
              ? resultados.map((r) => (
                  <li key={r.id} className={styles.listItem}>
                    <span>
                      {/* --- 6. ATUALIZAR EXIBIÇÃO DA LISTA --- */}
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
