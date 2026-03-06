import { useState, useEffect } from "react";
import axios from "axios";
import AlertService from "../../../services/AlertService";
import { regenerateStrategy } from "../../../services/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

/**
 * Hook: useMarioStrategy
 * Owns Spider analysis fetching, AI tactical actions, forceRefresh,
 * and safe JSON parsing of the AI response into structured battlecards.
 */
const useMarioStrategy = (leadId, activeTab) => {
  const [spiderData, setSpiderData] = useState(null);
  const [isSpiderLoading, setIsSpiderLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [strategyId, setStrategyId] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchSpiderStrategy = async (forceRefresh = false) => {
    setIsSpiderLoading(true);
    if (forceRefresh) {
      setAiResponse("");
    }
    try {
      const url = `/ai/spider-analysis/${leadId}${forceRefresh ? "?forceRefresh=true" : ""}`;
      const aiRequest = api.get(url);

      if (forceRefresh) {
        AlertService.promise(aiRequest, {
          loading: "MARIO re-calculando estrategia...",
          success: "Playbook regenerado en base de datos",
          error: "Fallo crítico en neuro-procesamiento",
        })
          .then(({ data }) => {
            setSpiderData(data.spider_verdict);
            setAiResponse(data.mario_strategy);
            setStrategyId(data.strategy_id);
          })
          .finally(() => {
            setIsSpiderLoading(false);
          });
      } else {
        const { data } = await aiRequest;
        setSpiderData(data.spider_verdict);
        setAiResponse(data.mario_strategy);
        setStrategyId(data.strategy_id);
        setIsSpiderLoading(false);
      }
    } catch (err) {
      console.error("Spider fetch error:", err);
      AlertService.error("Fallo al calcular Estrategia Neuro-Simbólica.");
      setIsSpiderLoading(false);
    }
  };

  const handleRLHFRegeneration = async (isRlhf = false, options = {}) => {
    setIsSpiderLoading(true);
    try {
      const { data } = await regenerateStrategy(leadId, options);
      setAiResponse(data.mario_strategy);
      setStrategyId(data.strategy_id);
      return data;
    } catch (err) {
      console.error("Regeneration error:", err);
      throw err;
    } finally {
      setIsSpiderLoading(false);
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
      success: `¡${label} estratégico generado!`,
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
      return null; // Components handle the raw fallback
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
  };
};

export default useMarioStrategy;
