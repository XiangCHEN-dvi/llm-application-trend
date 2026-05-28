/**
 * Per-concept Google Trends search terms (keys must match concepts.json + products.json ids).
 * Each term is queried separately; monthly score = max across terms (0–100 each).
 * Used by fetch-heat and the UI (no separate sync step).
 */

/** @type {Record<string, { terms: string[] }>} */
export const CONCEPT_SIGNALS = {
  "chain-of-thought": {
    terms: ["chain of thought", "chain-of-thought prompting"],
  },
  "react-pattern": {
    terms: ["LLM ReAct", "ReAct Prompting", "reasoning and acting"],
  },
  "prompt-engineering": {
    terms: ["prompt engineering", "LLM prompt engineering"],
  },
  "context-engineering": {
    terms: ["context engineering", "LLM context engineering"],
  },
  rag: {
    terms: ["retrieval augmented generation", "RAG LLM"],
  },
  graphrag: {
    terms: ["GraphRAG"],
  },
  "vector-db": {
    terms: ["vector database"],
  },
  "tool-use": {
    terms: ["LLM function calling", "LLM tool use"],
  },
  mcp: {
    terms: ["Model Context Protocol", "MCP server"],
  },
  a2a: {
    terms: ["Agent2Agent protocol", "A2A protocol"],
  },
  skills: {
    terms: ["Anthropic Skills", "Claude Skills", "LLM agent skills"],
  },
  "langchain-langgraph": {
    terms: ["LangChain", "LangGraph"],
  },
  llamaindex: {
    terms: ["LlamaIndex"],
  },
  autogpt: {
    terms: ["AutoGPT", "Auto-GPT"],
  },
  camel: {
    terms: ["CAMEL-AI", "CAMEL agent framework"],
  },
  crewai: {
    terms: ["CrewAI framework", "CrewAI agents"],
  },
  "agent-harness": {
    terms: ["OpenHarness", "LLM harness"],
  },
  openclaw: {
    terms: ["OpenClaw", "Clawdbot"],
  },
  "hermes-agent": {
    terms: ["Hermes agent", "hermes-agent"],
  },
  qwen: {
    terms: ["Qwen LLM", "Alibaba Qwen", "Tongyi Qwen"],
  },
  deepseek: {
    terms: ["DeepSeek", "DeepSeek R1", "DeepSeek V3", "DeepSeek V4"],
  },
  glm: {
    terms: ["ChatGLM", "Zhipu GLM", "Zhipu AI"],
  },
  kimi: {
    terms: ["Moonshot AI", "Moonshot Kimi", "Kimi LLM"],
  },
  minimax: {
    terms: ["Hailuo AI", "MiniMax LLM"],
  },
  gpt: {
    terms: ["ChatGPT", "OpenAI GPT", "Codex"],
  },
  claude: {
    terms: ["Anthropic Claude", "Claude AI", "Claude Code"],
  },
  gemini: {
    terms: ["Google Gemini", "Gemini AI"],
  },
  grok: {
    terms: ["xAI Grok", "Grok AI"],
  },
  seed: {
    terms: ["Doubao", "bytedance seed"],
  },
  chatbot: {
    terms: ["LLM chatbot"],
  },
  "llm-agent": {
    terms: ["agentic AI", "LLM agent", "LLM workflow"],
  },
  copilot: {
    terms: ["GitHub Copilot Chat", "Microsoft Copilot"],
  },
  "deep-research": {
    terms: ["Deep Research"],
  },
  "vibe-coding": {
    terms: ["vibe coding"],
  },
};
