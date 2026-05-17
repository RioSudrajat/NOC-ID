import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import parts from "../src/data/pcx150Parts.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../public/models/pcx_150_selectable.glb");

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    }).catch((error) => {
      this.error = error;
      this.onerror?.(error);
    });
  }
};

function geometryFor(part) {
  const [x, y, z] = part.scale;
  if (part.shape === "cylinder") return new CylinderGeometry(x, y, z, 24);
  if (part.shape === "sphere") return new SphereGeometry(x, 24, 16);
  if (part.shape === "torus") return new TorusGeometry(x, y, 24, 48);
  return new BoxGeometry(x, y, z);
}

const scene = new Scene();

for (const part of parts) {
  const material = new MeshStandardMaterial({
    color: part.color,
    metalness: ["engine", "cvt", "gearbox", "frame", "brake", "suspension"].includes(part.zone) ? 0.55 : 0.2,
    roughness: ["body", "lighting"].includes(part.zone) ? 0.28 : 0.55,
  });
  const mesh = new Mesh(geometryFor(part), material);
  mesh.name = part.id;
  mesh.userData = {
    partId: part.id,
    label: part.label,
    zone: part.zone,
    health: part.health,
    explodeDir: part.explodeDir,
  };
  mesh.position.set(...part.position);
  mesh.rotation.set(...part.rotation);
  scene.add(mesh);
}

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(scene, { binary: true });
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(glb));
console.log(`Generated ${outputPath} with ${parts.length} selectable PCX components.`);
