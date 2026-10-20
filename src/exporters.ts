import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

// Polyfill FileReader for Node.js environments if running headlessly
if (typeof globalThis !== 'undefined' && !globalThis.FileReader) {
  class NodeFileReader {
    result: any = null;
    onload: ((e: any) => void) | null = null;
    onloadend: ((e: any) => void) | null = null;

    readAsArrayBuffer(blob: Blob): void {
      blob.arrayBuffer().then((buf: ArrayBuffer) => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }

    readAsDataURL(blob: Blob): void {
      blob.arrayBuffer().then((buf: ArrayBuffer) => {
        const base64 = Buffer.from(buf).toString('base64');
        this.result = `data:application/octet-stream;base64,${base64}`;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }
  }

  (globalThis as any).FileReader = NodeFileReader;
}

/**
 * Export a THREE.Object3D (Mesh, Group) to binary GLB format.
 */
export async function exportToGLB(object: THREE.Object3D): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(object, { binary: true });
  return result as ArrayBuffer;
}

/**
 * Export a THREE.Object3D to human-readable glTF JSON.
 */
export async function exportToGLTF(object: THREE.Object3D): Promise<Record<string, any>> {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(object, { binary: false });
  return result as Record<string, any>;
}

/**
 * Export a THREE.Object3D to Wavefront OBJ format string.
 */
export function exportToOBJ(object: THREE.Object3D): string {
  const exporter = new OBJExporter();
  return exporter.parse(object);
}

/**
 * Export a THREE.Object3D to ASCII or binary STL format.
 */
export function exportToSTL(object: THREE.Object3D, binary = false): string | DataView {
  const exporter = new STLExporter();
  return exporter.parse(object, { binary });
}
