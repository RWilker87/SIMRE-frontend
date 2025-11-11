// src/components/PainelPrincipal.jsx (Atualizado com dados reais)

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./PainelPrincipal.module.css";

export default function PainelPrincipal() {
  const [loading, setLoading] = useState(true);
  const [totalEscolas, setTotalEscolas] = useState(0);
  const [totalResultados, setTotalResultados] = useState(0); // NOVO ESTADO
  const [atividadesRecentes, setAtividadesRecentes] = useState([]); // Vai guardar escolas E resultados

  // Função para formatar o tempo (ex: "Há 2 horas")
  function formatTempo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);

    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffHr < 24) return `Há ${diffHr} h`;
    return `Há ${diffDay} d`;
  }

  // Hook para buscar os dados quando o componente carregar
  useEffect(() => {
    async function fetchDados() {
      setLoading(true);

      // --- 1. BUSCAR DADOS DAS ESCOLAS ---
      // Contagem total
      const { count: countEscolas, error: countError } = await supabase
        .from("escolas")
        .select("*", { count: "exact", head: true });

      if (!countError && countEscolas !== null) {
        setTotalEscolas(countEscolas);
      } else {
        console.error(
          "Erro ao buscar contagem de escolas:",
          countError?.message
        );
      }

      // Últimas 5 escolas
      const { data: escolasData, error: escolasError } = await supabase
        .from("escolas")
        .select("nome_escola, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // --- 2. BUSCAR DADOS DOS RESULTADOS ---
      // Contagem total
      const { count: countResultados, error: countResultadosError } =
        await supabase
          .from("resultados")
          .select("*", { count: "exact", head: true });

      if (!countResultadosError && countResultados !== null) {
        setTotalResultados(countResultados);
      } else {
        console.error(
          "Erro ao buscar contagem de resultados:",
          countResultadosError?.message
        );
      }

      // Últimos 5 resultados (e o nome da escola relacionada)
      const { data: resultadosData, error: resultadosError } = await supabase
        .from("resultados")
        .select("created_at, avaliacao, disciplina, escola_id(nome_escola)") // Busca o nome da escola
        .order("created_at", { ascending: false })
        .limit(5);

      // --- 3. JUNTAR, ORDENAR E MOSTRAR ATIVIDADES ---
      let atividades = [];

      if (!escolasError && escolasData) {
        atividades = atividades.concat(
          escolasData.map((escola) => ({
            tipo: "Nova Escola",
            titulo: escola.nome_escola,
            subtitulo: "Escola cadastrada no sistema",
            data: escola.created_at,
          }))
        );
      }

      if (!resultadosError && resultadosData) {
        atividades = atividades.concat(
          resultadosData.map((r) => ({
            tipo: "Novo Resultado",
            titulo: `${r.disciplina} - ${r.avaliacao}`,
            subtitulo: r.escola_id?.nome_escola || "Escola não encontrada", // Mostra o nome da escola
            data: r.created_at,
          }))
        );
      }

      // Ordena a lista combinada pela data mais recente
      const atividadesOrdenadas = atividades
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5); // Pega apenas as 5 mais recentes

      setAtividadesRecentes(atividadesOrdenadas);
      setLoading(false);
    }

    fetchDados();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Cards de KPI ATUALIZADOS */}
      <div className={styles.kpiContainer}>
        {/* Card 1: Total de Escolas */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>
            {loading ? "..." : totalEscolas}
          </span>
          <span className={styles.kpiLabel}>Total de Escolas</span>
        </div>

        {/* Card 2: Total de Resultados */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>
            {loading ? "..." : totalResultados}
          </span>
          <span className={styles.kpiLabel}>Resultados Lançados</span>
        </div>
        {/* Você pode adicionar mais 2 cards aqui (ex: Média Geral) */}
      </div>

      {/* Conteúdo Principal (AGORA COM DADOS REAIS) */}
      <div className={styles.contentRow}>
        {/* Atividades Recentes ATUALIZADAS */}
        <div className={styles.contentCard}>
          <h3>Últimas Atividades no Sistema</h3>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <ul className={styles.listaAtividades}>
              {atividadesRecentes.length === 0 ? (
                <li>
                  <strong>Nenhuma atividade recente.</strong>
                  <span>Comece cadastrando uma escola.</span>
                </li>
              ) : (
                atividadesRecentes.map((atividade) => (
                  <li key={atividade.data + atividade.titulo}>
                    <strong>{atividade.tipo}</strong>
                    <span>{atividade.titulo}</span>
                    <span className={styles.subtitulo}>
                      {atividade.subtitulo}
                    </span>
                    <span className={styles.tempo}>
                      {formatTempo(atividade.data)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* Espaço reservado para o futuro */}
        <div className={styles.contentCard}>
          <h3>Estatísticas</h3>
          <p>
            Mais gráficos e estatísticas sobre as escolas cadastradas aparecerão
            aqui em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
