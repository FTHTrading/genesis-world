import AgentDetail from "./AgentDetail";

const ALL_AGENT_IDS = [
  "aurum-helion-001", "aurum-vega-002", "aurum-lyra-003",
  "lex-arbiter-001", "lex-mandate-002", "lex-quorum-003",
  "nova-pulsar-001", "nova-cipher-002", "nova-drift-003",
  "merc-nexus-001", "merc-anchor-002", "merc-flux-003",
  "ludo-entropy-001", "ludo-chaos-002", "ludo-spark-003",
];

export function generateStaticParams() {
  return ALL_AGENT_IDS.map((id) => ({ id }));
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgentDetail agentId={id} />;
}
