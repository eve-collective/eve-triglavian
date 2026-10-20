import * as THREE from 'three';
/**
 * Export a THREE.Object3D (Mesh, Group) to binary GLB format.
 */
export declare function exportToGLB(object: THREE.Object3D): Promise<ArrayBuffer>;
/**
 * Export a THREE.Object3D to human-readable glTF JSON.
 */
export declare function exportToGLTF(object: THREE.Object3D): Promise<Record<string, any>>;
/**
 * Export a THREE.Object3D to Wavefront OBJ format string.
 */
export declare function exportToOBJ(object: THREE.Object3D): string;
/**
 * Export a THREE.Object3D to ASCII or binary STL format.
 */
export declare function exportToSTL(object: THREE.Object3D, binary?: boolean): string | DataView;
//# sourceMappingURL=exporters.d.ts.map