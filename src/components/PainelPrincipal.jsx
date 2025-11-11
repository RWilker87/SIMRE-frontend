// src/components/PainelPrincipal.jsx (Atualizado com mais KPIs)

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./PainelPrincipal.module.css";

export default function PainelPrincipal() {
  const [loading, setLoading] = useState(true);
  const [totalEscolas, setTotalEscolas] = useState(0);
  const [totalResultados, setTotalResultados] = useState(0);
  const [atividadesRecentes, setAtividadesRecentes] = useState([]);

  // --- NOVOS ESTADOS PARA KPIs ---
  const [mediaAnoAtual, setMediaAnoAtual] = useState(0);
  const [crescimento, setCrescimento] = useState(0);

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
      }

      // Últimas 5 escolas (para atividades)
      const { data: escolasData, error: escolasError } = await supabase
        .from("escolas")
        .select("nome_escola, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // --- 2. BUSCAR DADOS DOS RESULTADOS ---
      // Busca TODOS os resultados para calcular médias
      const { data: todosResultados, error: todosResultadosError } =
        await supabase.from("resultados").select("ano, valor_indice");

      if (!todosResultadosError && todosResultados) {
        setTotalResultados(todosResultados.length);

        // --- CÁLCULO DAS NOVAS KPIs ---
        const anoAtual = new Date().getFullYear();
        const anoAnterior = anoAtual - 1;

        const resultadosAnoAtual = todosResultados.filter(
          (r) => r.ano === anoAtual
        );
        const resultadosAnoAnterior = todosResultados.filter(
          (r) => r.ano === anoAnterior
        );

        const calcularMedia = (arr) => {
          if (arr.length === 0) return 0;
          const soma = arr.reduce(
            (acc, val) => acc + (val.valor_indice || 0),
            0
          );
          return soma / arr.length;
        };

        const mediaAtual = calcularMedia(resultadosAnoAtual);
        const mediaAnterior = calcularMedia(resultadosAnoAnterior);

        setMediaAnoAtual(mediaAtual);

        if (mediaAnterior > 0 && mediaAtual > 0) {
          const perc = ((mediaAtual - mediaAnterior) / mediaAnterior) * 100;
          setCrescimento(perc);
        }
      }

      // Últimos 5 resultados (para atividades)
      const { data: resultadosData, error: resultadosAtividadesError } =
        await supabase
          .from("resultados")
          .select("created_at, avaliacao, disciplina, escola_id(nome_escola)")
          .order("created_at", { ascending: false })
          .limit(5);

      // --- 3. JUNTAR E MOSTRAR ATIVIDADES ---
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
      if (!resultadosAtividadesError && resultadosData) {
        atividades = atividades.concat(
          resultadosData.map((r) => ({
            tipo: "Novo Resultado",
            titulo: `${r.disciplina} - ${r.avaliacao}`,
            subtitulo: r.escola_id?.nome_escola || "Escola não encontrada",
            data: r.created_at,
          }))
        );
      }

      const atividadesOrdenadas = atividades
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);

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
          {/* Corrigido para usar a classe Neutra */}
          <span className={styles.kpiLabelNeutro}>Total de Escolas</span>
        </div>

        {/* Card 2: Total de Resultados */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>
            {loading ? "..." : totalResultados}
          </span>
          <span className={styles.kpiLabelNeutro}>Resultados Lançados</span>
        </div>

        {/* NOVO Card 3: Média Geral */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>
            {loading ? "..." : mediaAnoAtual.toFixed(2)}
          </span>
          <span className={styles.kpiLabelNeutro}>
            Média Geral ({new Date().getFullYear()})
          </span>
        </div>

        {/* NOVO Card 4: Crescimento */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>
            {loading ? "..." : `${crescimento.toFixed(1)}%`}
          </span>
          {/* Estilo condicional para cor */}
          <span
            className={
              crescimento >= 0
                ? styles.kpiLabelPositivo
                : styles.kpiLabelNegativo
            }
          >
            Crescimento (vs. Ano Anterior)
          </span>
        </div>
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
