// src/components/DetalhesEscola.jsx

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient.js";
import styles from "./DetalhesEscola.module.css";
import painelStyles from "./PainelPrincipal.module.css";

// ==========================================================
// COMPONENTE DE GRÁFICO — BARRAS + LINHA (MIX)
// ==========================================================
const GraficoDeBarras = ({ titulo, data }) => {
  if (!data || data.length === 0) return null;

  // --- dados já ordenados por ano (garantido externamente) ---
  const pontos = data.map((d) => ({
    ano: d.ano,
    valor: Number(d.valor_indice ?? 0),
    avaliacao: d.avaliacao,
    serie: d.serie,
    disciplina: d.disciplina,
  }));

  function formatarTitulo(titulo) {
    if (!titulo) return "";

    // Remove espaços extras
    let novo = titulo.trim();

    // Substitui diferentes tipos de hífens por um padrão
    novo = novo.replace(/[-–—]+/g, " - ");

    // Remove espaços duplicados
    novo = novo.replace(/\s+/g, " ");

    // Coloca em MAIÚSCULAS
    novo = novo.toUpperCase();

    // Substitui " - " por " – " (travessão)
    novo = novo.replace(/ - /g, " – ");

    // Converte ordinais masculinos: 5o → 5º
    novo = novo.replace(/(\d+)\s*o\b/gi, "$1º");

    return novo;
  }

  // --- DEFINIR ESCALA ---
  const serie = (pontos[0].serie || "").toString().toLowerCase();
  const avaliacao = (pontos[0].avaliacao || "").toString().toLowerCase();

  let maxValor = 10;
  if (serie.includes("2")) maxValor = 1000;
  else if (serie.includes("5") || serie.includes("9")) maxValor = 500;
  if (avaliacao.includes("ideb") || avaliacao.includes("idepe")) maxValor = 10;

  // marcadores para eixo Y
  const gerarMarcadores = () => {
    if (maxValor === 10) return [10, 7.5, 5, 2.5, 0];
    if (maxValor === 500) return [500, 375, 250, 125, 0];
    return [1000, 750, 500, 250, 0]; // 1000
  };
  const marcadores = gerarMarcadores();

  // cores (ciclo)
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE"];

  // --- Gerar pontos para svg (percentuais) ---
  const svgPoints = useMemo(() => {
    const n = pontos.length;
    if (n === 0) return [];
    return pontos.map((p, i) => {
      const x = n === 1 ? 50 : (i / (n - 1)) * 100; // porcentagem do eixo x
      const y = 100 - (Math.min(p.valor, maxValor) / maxValor) * 100; // porcentagem invertida
      return { x, y, valor: p.valor, ano: p.ano };
    });
  }, [pontos, maxValor]);

  // Build polyline string for SVG if > 1 point
  const polylineStr =
    svgPoints.length > 1
      ? svgPoints.map((pt) => `${pt.x},${pt.y}`).join(" ")
      : "";

  return (
    <div className={styles.graficoCard}>
      <h3>{formatarTitulo(titulo)}</h3>

      <div className={styles.chartContainer}>
        {/* Eixo Y */}
        <div className={styles.yAxis}>
          {marcadores.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>

        {/* Conteúdo do gráfico (barras + SVG linha) */}
        <div className={styles.chartContent} style={{ position: "relative" }}>
          {/* SVG overlay para linha e marcadores */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 2, // sobreposto às barras para a linha ficar acima
            }}
            aria-hidden="true"
          >
            {/* grade horizontal opcional (leve) */}
            {marcadores.map((m, idx) => {
              const y = 100 - (m / maxValor) * 100;
              return (
                <line
                  key={`grid-${idx}`}
                  x1="0"
                  x2="100"
                  y1={`${y}`}
                  y2={`${y}`}
                  stroke="#f3f3f3"
                  strokeWidth="0.3"
                />
              );
            })}

            {/* polylines / linha conectando pontos (se houver >= 2) */}
            {polylineStr && (
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#333"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            )}

            {/* círculos marcadores */}
            {svgPoints.map((pt, i) => (
              <circle
                key={`p-${i}`}
                cx={`${pt.x}`}
                cy={`${pt.y}`}
                r={1.4}
                fill="#222"
                stroke="#fff"
                strokeWidth="0.3"
              />
            ))}
          </svg>

          {/* Barras (renderizadas por cima do background, mas abaixo do svg zIndex para linha sobrepor) */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              height: "100%",
              width: "100%",
              zIndex: 1,
            }}
          >
            {pontos.map((p, index) => {
              const heightPercent = Math.max(
                0,
                Math.min(100, (p.valor / maxValor) * 100)
              );
              return (
                <div key={p.ano} className={styles.barGroup}>
                  <div className={styles.barWrapper}>
                    <div
                      className={styles.bar}
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: colors[index % colors.length],
                        zIndex: 0,
                      }}
                      title={`${p.ano}: ${p.valor}`}
                    />
                  </div>
                  <span className={styles.barLabel}>{p.ano}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================================
// COMPONENTE PRINCIPAL — DetalhesEscola
// ==========================================================
export default function DetalhesEscola({ escola, onVoltar }) {
  const [user, setUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);

  const ADMIN_UID = "e55942f2-87c9-4811-9a0b-0841e8a39733";

  // GET USER
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setCanEdit(data?.user?.id === ADMIN_UID);
    }
    getUser();
  }, []);

  // FETCH RESULTADOS
  async function fetchResultados() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("resultados")
        .select("*")
        .eq("escola_id", escola.id)
        .order("ano", { ascending: true });

      if (error) throw error;
      setResultados(data || []);
    } catch (err) {
      alert("Erro ao buscar resultados: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (escola?.id) fetchResultados();
  }, [escola?.id]);

  // FORM STATE
  const [avaliacao, setAvaliacao] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [serie, setSerie] = useState("");
  const [valorIndice, setValorIndice] = useState("");
  const [disciplina, setDisciplina] = useState("");

  const handleAddResultado = async (e) => {
    e.preventDefault();
    if (!canEdit)
      return alert("Apenas o administrador pode adicionar resultados.");
    if (!avaliacao || !ano || !serie || !valorIndice || !disciplina) {
      alert("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("resultados").insert({
        escola_id: escola.id,
        avaliacao,
        ano: parseInt(ano, 10),
        serie,
        valor_indice: parseFloat(valorIndice),
        disciplina,
      });
      if (error) throw error;
      setAvaliacao("");
      setSerie("");
      setValorIndice("");
      setDisciplina("");
      await fetchResultados();
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResultado = async (id) => {
    if (!canEdit) return alert("Apenas o administrador pode deletar.");
    setLoading(true);
    try {
      const { error } = await supabase.from("resultados").delete().eq("id", id);
      if (error) throw error;
      await fetchResultados();
    } catch (err) {
      alert("Erro ao deletar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- AGRUPAR por AVALIAÇÃO / SÉRIE / DISCIPLINA (sem ano)
  const grupos = useMemo(() => {
    const map = {};
    resultados.forEach((r) => {
      function normalizar(str) {
        return String(str)
          .trim()
          .toLowerCase()
          .normalize("NFD") // remove acentos
          .replace(/[\u0300-\u036f]/g, "") // remove acentos 2
          .replace(/[º°]/g, "o") // normaliza 9º para 9o
          .replace(/\s+/g, " "); // evita espaços duplos
      }

      const chave = `${normalizar(r.avaliacao)} - ${normalizar(
        r.serie
      )} - ${normalizar(r.disciplina)}`;
      if (!map[chave]) map[chave] = [];
      // push raw objeto (mantendo ano e valor)
      map[chave].push({
        ...r,
        ano: Number(r.ano),
        valor_indice: Number(r.valor_indice ?? 0),
      });
    });
    // Ordenar cada lista por ano
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.ano - b.ano);
    });
    return map;
  }, [resultados]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onVoltar} className={styles.voltarButton}>
          &larr; Voltar
        </button>
        <h1>{escola?.nome_escola}</h1>
        <small>INEP: {escola?.codigo_inep}</small>
      </div>

      {/* GRÁFICOS */}
      <div className={styles.graficosContainer}>
        {loading ? (
          <p>Carregando gráficos...</p>
        ) : Object.keys(grupos).length > 0 ? (
          Object.entries(grupos).map(([chave, dados]) => {
            // titulo do gráfico e dados no formato esperado
            const titulo = chave;
            // dados já ordenados por ano
            const dadosFormatados = dados.map((d) => ({
              ano: d.ano,
              valor_indice: d.valor_indice,
              avaliacao: d.avaliacao,
              serie: d.serie,
              disciplina: d.disciplina,
            }));
            return (
              <GraficoDeBarras
                key={chave}
                titulo={titulo}
                data={dadosFormatados}
              />
            );
          })
        ) : (
          <p className={styles.noData}>Nenhum dado disponível.</p>
        )}
      </div>

      {/* FORMULÁRIO + LISTA */}
      <div className={painelStyles.contentRow}>
        {canEdit && (
          <form onSubmit={handleAddResultado} className={styles.cardForm}>
            <h3>Adicionar Novo Resultado</h3>

            <input
              type="text"
              placeholder="Avaliação (SAEB, IDEB, IDEPE...)"
              value={avaliacao}
              onChange={(e) => setAvaliacao(e.target.value)}
              className={styles.input}
            />

            <input
              type="text"
              placeholder="Disciplina"
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
              placeholder="Série (2º Ano, 5º Ano, 9º Ano)"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className={styles.input}
            />

            <input
              type="number"
              step="0.01"
              placeholder="Nota / Índice"
              value={valorIndice}
              onChange={(e) => setValorIndice(e.target.value)}
              className={styles.input}
            />

            <button
              type="submit"
              disabled={loading}
              className={styles.addButton}
            >
              {loading ? "Salvando..." : "Adicionar"}
            </button>
          </form>
        )}

        {/* LISTA DE RESULTADOS */}
        <div className={canEdit ? styles.cardList : styles.cardListFullWidth}>
          <h3>Todos os Resultados</h3>

          {loading ? (
            <p>Carregando...</p>
          ) : resultados.length === 0 ? (
            <p>Nenhum resultado cadastrado.</p>
          ) : (
            <ul className={styles.list}>
              {resultados.map((r) => (
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
                      {r.valor_indice?.toFixed(2) || "N/A"}
                    </span>
                  </div>

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
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
