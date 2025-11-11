// src/components/DetalhesEscola.jsx (NOVO ARQUIVO)

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./DetalhesEscola.module.css"; // Vamos criar este CSS
import painelStyles from "./PainelPrincipal.module.css"; // Reutilizar o grid

export default function DetalhesEscola({ escola, onVoltar }) {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário de resultados
  const [avaliacao, setAvaliacao] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear()); // Padrão para o ano atual
  const [serie, setSerie] = useState("");
  const [valorIndice, setValorIndice] = useState("");

  // Função para buscar os resultados existentes
  async function fetchResultados() {
    setLoading(true);
    const { data, error } = await supabase
      .from("resultados")
      .select("*")
      .eq("escola_id", escola.id) // Busca resultados SÓ desta escola
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
  }, [escola.id]); // O [escola.id] garante que a busca rode se a escola mudar

  // Função para adicionar um novo resultado
  const handleAddResultado = async (e) => {
    e.preventDefault();
    if (!avaliacao || !ano || !serie || !valorIndice) {
      alert("Por favor, preencha todos os campos do resultado.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("resultados").insert({
      escola_id: escola.id, // Vincula o resultado à escola
      avaliacao: avaliacao,
      ano: parseInt(ano), // Garante que seja um número
      serie: serie,
      valor_indice: parseFloat(valorIndice), // Garante que seja um float
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
                      <strong>{r.avaliacao}</strong> ({r.ano} - {r.serie})
                    </span>
                    <span className={styles.indiceValor}>
                      {r.valor_indice.toFixed(2)}
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
