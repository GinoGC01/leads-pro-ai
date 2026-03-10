import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import AlertService from "../../../services/AlertService";
import { regenerateStrategy } from "../../../services/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

/**
 * Hook: useMarioStrategy
 * Owns Spider analysis fetching, AI tactical actions, forceRefresh,
 * pipeline progress polling, and safe JSON parsing of the AI response.
 */
const useMarioStrategy = (leadId, activeTab) => {
  const [spiderData, setSpiderData] = useState(null);
  const [isSpiderLoading, setIsSpiderLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [strategyId, setStrategyId] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pipelineMetadata, setPipelineMetadata] = useState(null);
  const [pipelineProgress, setPipelineProgress] = useState(null);
  const pollingRef = useRef(null);

  // ═══════════════════════════════════════════════════
  // PIPELINE PROGRESS POLLING
  // Polls /api/ai/pipeline-status/:leadId every 600ms while loading
  // ═══════════════════════════════════════════════════
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/ai/pipeline-status/${leadId}`);
        setPipelineProgress(data);

        // Stop polling when pipeline completes or errors
        if (!data.active && data.agents?.length > 0) {
          stopPolling();
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 600);
  }, [leadId]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const fetchSpiderStrategy = async (forceRefresh = false, objectionMode = "STANDARD") => {
    setIsSpiderLoading(true);
    setPipelineProgress(null);

    if (forceRefresh) {
      setAiResponse("");
    }

    // Start polling for pipeline progress
    startPolling();

    try {
      const url = `/ai/spider-analysis/${leadId}?${forceRefresh ? "forceRefresh=true" : ""}${objectionMode ? `&objection_mode=${objectionMode}` : ""}`;
      const aiRequest = api.get(url);

      if (forceRefresh) {
        AlertService.promise(aiRequest, {
          loading: "MARIO ejecutando pipeline multi-agente...",
          success: "Playbook generado por pipeline V11",
          error: "Fallo en pipeline multi-agente",
        })
          .then(({ data }) => {
            setSpiderData(data.spider_verdict);
            setAiResponse(data.mario_strategy);
            setStrategyId(data.strategy_id);
            setPipelineMetadata(data.pipeline_metadata || null);
          })
          .finally(() => {
            setIsSpiderLoading(false);
            stopPolling();
          });
      } else {
        const { data } = await aiRequest;
        setSpiderData(data.spider_verdict);
        setAiResponse(data.mario_strategy);
        setStrategyId(data.strategy_id);
        setPipelineMetadata(data.pipeline_metadata || null);
        setIsSpiderLoading(false);
        stopPolling();
      }
    } catch (err) {
      console.error("Spider fetch error:", err);
      AlertService.error("Fallo al calcular Estrategia.");
      setIsSpiderLoading(false);
      stopPolling();
    }
  };

  const handleRLHFRegeneration = async (isRlhf = false, options = {}) => {
    setIsSpiderLoading(true);
    setPipelineProgress(null);
    startPolling();

    try {
      const { data } = await regenerateStrategy(leadId, options);
      setAiResponse(data.mario_strategy);
      setStrategyId(data.strategy_id);
      setPipelineMetadata(data.pipeline_metadata || null);
      return data;
    } catch (err) {
      console.error("Regeneration error:", err);
      throw err;
    } finally {
      setIsSpiderLoading(false);
      stopPolling();
    }
  };

  // Auto-fetch Spider analysis when 'estrategia' tab opens
  useEffect(() => {
    if (
      activeTab === "estrategia" &&
      !spiderData &&
      !isSpiderLoading &&
      !aiResponse
    ) {
      fetchSpiderStrategy(false);
    }
  }, [activeTab, leadId, spiderData, aiResponse, isSpiderLoading]);

  const handleTacticalAction = async (prompt, label) => {
    setIsAiLoading(true);
    setAiResponse("");

    const aiRequest = api.post("/ai/chat", {
      query: prompt,
      leadId,
    });

    AlertService.promise(aiRequest, {
      loading: `Generando ${label}...`,
      success: `${label} estrategico generado!`,
      error: `Error al generar ${label}`,
    })
      .then(({ data }) => {
        setAiResponse(data.answer);
      })
      .finally(() => {
        setIsAiLoading(false);
      });
  };

  // Parse aiResponse JSON safely
  const parsedStrategy = (() => {
    if (!aiResponse) return null;
    try {
      let cleanJSON = aiResponse;
      if (typeof cleanJSON === "string" && cleanJSON.startsWith("```json")) {
        cleanJSON = cleanJSON.replace(/^```json\n/, "").replace(/\n```$/, "");
      }
      return typeof cleanJSON === "string" ? JSON.parse(cleanJSON) : cleanJSON;
    } catch (e) {
      return null;
    }
  })();

  return {
    spiderData,
    aiResponse,
    strategyId,
    isSpiderLoading,
    isAiLoading,
    fetchSpiderStrategy,
    handleRLHFRegeneration,
    handleTacticalAction,
    parsedStrategy,
    pipelineMetadata,
    pipelineProgress,
  };
};

export default useMarioStrategy;
