// 🚨 DIAGNÓSTICO SIMPLE
console.log('═══ DIAGNÓSTICO RÁPIDO ═══');
console.log('1. Scene:', maira3DScene?.children.length || 0, 'objetos');
console.log('2. Groups:', maira3DScene?.children.filter(c => c.type === 'Group').length || 0);
console.log('3. SatelliteAnalyzer:', typeof satelliteAnalyzer !== 'undefined' ? 'SÍ' : 'NO');
if (typeof satelliteAnalyzer !== 'undefined' && satelliteAnalyzer) {
    const feats = satelliteAnalyzer.getFeatures ? satelliteAnalyzer.getFeatures() : [];
    console.log('4. Features detectados:', feats.length);
    const vegCount = feats.filter(f => f.type === 'vegetation' || f.type === 'forest').length;
    console.log('5. Features vegetation/forest:', vegCount);
}
console.log('═══════════════════════════');
