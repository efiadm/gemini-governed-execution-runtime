// Async audit pipeline - runs after execution completes
import { addArtifact, updateRunState } from "./runStore";
import { calculateStructureScore, detectAuthorityDrift, calculateCitationIntegrity } from "./deterministicScorers";
import { hashPrompt } from "./utils";

export async function runAuditPipeline(executionResult, settings) {
  const { auditEnabled, auditDepth } = settings;
  
  if (!auditEnabled) {
    return { status: "skipped", reason: "Audit disabled in settings" };
  }
  
  const auditState = {
    status: "running",
    started_at: Date.now(),
    completed_at: null,
    depth: auditDepth,
    results: {},
    errors: [],
  };
  
  updateRunState({ audit: auditState });
  
  try {
    // Lightweight audits (always run)
    const lightAudits = await runLightweightAudits(executionResult);
    auditState.results.lightweight = lightAudits;
    
    // Standard audits
    if (auditDepth === "standard" || auditDepth === "heavy") {
      const standardAudits = await runStandardAudits(executionResult);
      auditState.results.standard = standardAudits;
    }
    
    // Heavy audits (expensive, may call model)
    if (auditDepth === "heavy") {
      const heavyAudits = await runHeavyAudits(executionResult, settings);
      auditState.results.heavy = heavyAudits;
    }
    
    auditState.status = "complete";
    auditState.completed_at = Date.now();
    auditState.duration_ms = auditState.completed_at - auditState.started_at;
    
    // Update drift and hallucination in runState
    updateRunState({
      audit: auditState,
      drift: {
        stability_score: auditState.results.lightweight?.stability_score || null,
        structure_score: auditState.results.lightweight?.structure_score || 0,
        authority_flags: auditState.results.lightweight?.authority_drift?.flags || [],
        mode_divergence: auditState.results.standard?.mode_divergence || null,
      },
      hallucination: {
        citation_integrity: auditState.results.lightweight?.citation_integrity || null,
      },
    });
    
    addArtifact({ 
      type: "audit_complete", 
      depth: auditDepth,
      duration_ms: auditState.duration_ms,
      mode: executionResult.evidence.mode,
      timestamp: Date.now() 
    });
    
    return auditState;
  } catch (error) {
    auditState.status = "failed";
    auditState.completed_at = Date.now();
    auditState.errors.push(error.message);
    updateRunState({ audit: auditState });
    
    return auditState;
  }
}

async function runLightweightAudits(executionResult) {
  // Simulate async delay (in real system, these would be CPU-bound tasks)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const { output, rawOutput, evidence } = executionResult;
  
  const results = {
    structure_score: calculateStructureScore(output),
    authority_drift: detectAuthorityDrift(output, rawOutput),
    citation_integrity: calculateCitationIntegrity(output, evidence.grounding === "on"),
    output_hash: hashPrompt(JSON.stringify(output)),
  };
  
  addArtifact({ 
    type: "lightweight_audit", 
    results: {
      structure: results.structure_score,
      authority_flags: results.authority_drift.flags.length,
      citation_score: results.citation_integrity.score,
    },
    mode: evidence.mode,
    timestamp: Date.now() 
  });
  
  return results;
}

async function runStandardAudits(executionResult) {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const results = {
    response_length: JSON.stringify(executionResult.output).length,
    field_counts: {
      canonical_answer: executionResult.output.canonical_answer?.length || 0,
      perspectives: Object.keys(executionResult.output.three_perspectives || {}).length,
      unknowns: executionResult.output.unknowns_and_checks?.length || 0,
      next_steps: executionResult.output.next_steps?.length || 0,
      sources: executionResult.output.sources?.items?.length || 0,
    },
  };
  
  addArtifact({ 
    type: "standard_audit", 
    field_counts: results.field_counts,
    mode: executionResult.evidence.mode,
    timestamp: Date.now() 
  });
  
  return results;
}

async function runHeavyAudits(executionResult, settings) {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Heavy audits could call a cheaper model for fact-checking, semantic similarity, etc.
  // For now, just simulate with deterministic checks
  const results = {
    semantic_coherence: Math.random() * 20 + 80, // Mock score
    cross_reference_quality: executionResult.output.sources?.items?.length > 0 ? 85 : 50,
    note: "Heavy audits simulated. In production, would use cheaper model for semantic analysis.",
  };
  
  addArtifact({ 
    type: "heavy_audit", 
    model: settings.auditModel,
    results,
    mode: executionResult.evidence.mode,
    timestamp: Date.now() 
  });
  
  return results;
}