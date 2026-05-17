/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function replaceRoundedBox(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove import
  content = content.replace(/import { RoundedBox } from "@react-three\/drei";\n/g, '');

  // Replace <RoundedBox args={[...]} ... castShadow>{...}</RoundedBox>
  // Replace <RoundedBox args={[...]} ...>{...}</RoundedBox>
  
  content = content.replace(/<RoundedBox\s+args={(\[[^\]]+\])}[^>]*castShadow[^>]*>([\s\S]*?)<\/RoundedBox>/g, '<mesh castShadow><boxGeometry args={$1} />$2</mesh>');
  content = content.replace(/<RoundedBox\s+args={(\[[^\]]+\])}[^>]*>([\s\S]*?)<\/RoundedBox>/g, '<mesh><boxGeometry args={$1} />$2</mesh>');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', path.basename(filePath));
}

replaceRoundedBox('d:/Projekan/NOC ID/frontend/src/components/3d/HarleyDavidsonModel.tsx');
replaceRoundedBox('d:/Projekan/NOC ID/frontend/src/components/3d/BMWM4Model.tsx');
