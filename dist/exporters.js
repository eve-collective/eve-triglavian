import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
// Polyfill FileReader for Node.js environments if running headlessly
if (typeof globalThis !== 'undefined' && !globalThis.FileReader) {
    class NodeFileReader {
        result = null;
        onload = null;
        onloadend = null;
        readAsArrayBuffer(blob) {
            blob.arrayBuffer().then((buf) => {
                this.result = buf;
                if (this.onload)
                    this.onload({ target: this });
                if (this.onloadend)
                    this.onloadend({ target: this });
            });
        }
        readAsDataURL(blob) {
            blob.arrayBuffer().then((buf) => {
                const base64 = Buffer.from(buf).toString('base64');
                this.result = `data:application/octet-stream;base64,${base64}`;
                if (this.onload)
                    this.onload({ target: this });
                if (this.onloadend)
                    this.onloadend({ target: this });
            });
        }
    }
    globalThis.FileReader = NodeFileReader;
}
/**
 * Export a THREE.Object3D (Mesh, Group) to binary GLB format.
 */
export async function exportToGLB(object) {
    const exporter = new GLTFExporter();
    const result = await exporter.parseAsync(object, { binary: true });
    return result;
}
/**
 * Export a THREE.Object3D to human-readable glTF JSON.
 */
export async function exportToGLTF(object) {
    const exporter = new GLTFExporter();
    const result = await exporter.parseAsync(object, { binary: false });
    return result;
}
/**
 * Export a THREE.Object3D to Wavefront OBJ format string.
 */
export function exportToOBJ(object) {
    const exporter = new OBJExporter();
    return exporter.parse(object);
}
/**
 * Export a THREE.Object3D to ASCII or binary STL format.
 */
export function exportToSTL(object, binary = false) {
    const exporter = new STLExporter();
    return exporter.parse(object, { binary });
}
//# sourceMappingURL=exporters.js.map