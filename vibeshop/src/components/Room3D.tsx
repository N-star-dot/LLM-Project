"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import { CuratedProduct, VibeContext } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface Room3DProps {
  product: CuratedProduct;
  context: VibeContext;
  onBack: () => void;
}

export function Room3D({ product, context, onBack }: Room3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cartAdded, setCartAdded] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    async function init() {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

      if (cancelled || !containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Use theme-aware colors from CSS variables
      const styles = getComputedStyle(document.documentElement);
      const bgColor = styles.getPropertyValue('--background').trim() || '#F7F1E8';
      const cardColor = styles.getPropertyValue('--card').trim() || '#FFFDF8';

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(bgColor);
      scene.fog = new THREE.Fog(bgColor, 8, 20);

      // Camera
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.set(3, 2.5, 4);
      camera.lookAt(0, 0.5, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2;
      controls.minDistance = 1.5;
      controls.maxDistance = 8;
      controls.target.set(0, 0.5, 0);

      // Lighting based on vibe
      const lighting = context.room_lighting;
      const accentColor = new THREE.Color(lighting.accent_color);
      const intensityMap: Record<string, number> = {
        low: 0.3,
        "low-medium": 0.5,
        medium: 0.7,
        "medium-high": 0.9,
        high: 1.1,
      };
      const intensity = intensityMap[lighting.intensity] ?? 0.7;

      // Ambient
      const ambient = new THREE.AmbientLight("#ffffff", 0.25);
      scene.add(ambient);

      // Main point light
      const mainLight = new THREE.PointLight(accentColor, intensity * 2, 12);
      mainLight.position.set(2, 3, 2);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      scene.add(mainLight);

      // Accent fill light
      const fillLight = new THREE.PointLight(accentColor, intensity * 0.8, 10);
      fillLight.position.set(-3, 2.5, -1);
      scene.add(fillLight);

      // Rim light
      const rimLight = new THREE.DirectionalLight("#ffffff", 0.3);
      rimLight.position.set(-2, 4, -3);
      scene.add(rimLight);

      // Floor — slightly darker than bg
      const floorGeo = new THREE.PlaneGeometry(12, 12);
      const floorColor = new THREE.Color(bgColor).multiplyScalar(0.85);
      const floorMat = new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: 0.85,
        metalness: 0.05,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      // Back wall
      const wallGeo = new THREE.PlaneGeometry(12, 5);
      const wallColor = new THREE.Color(cardColor).multiplyScalar(0.9);
      const wallMat = new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: 0.9,
        metalness: 0,
      });
      const backWall = new THREE.Mesh(wallGeo, wallMat);
      backWall.position.set(0, 2.5, -3);
      backWall.receiveShadow = true;
      scene.add(backWall);

      // Side wall
      const sideWall = new THREE.Mesh(wallGeo, wallMat.clone());
      sideWall.position.set(-4, 2.5, 0);
      sideWall.rotation.y = Math.PI / 2;
      sideWall.receiveShadow = true;
      scene.add(sideWall);

      // Furniture piece
      const { w, d, h } = product.dimensions;
      const scale = 0.02;
      const boxGeo = new THREE.BoxGeometry(w * scale, h * scale, d * scale);

      const textureLoader = new THREE.TextureLoader();
      const productColor = product.colors[0] || "#555555";

      const boxMat = new THREE.MeshStandardMaterial({
        color: productColor,
        roughness: 0.7,
        metalness: 0.1,
      });

      textureLoader.load(
        product.image_url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          boxMat.map = texture;
          boxMat.needsUpdate = true;
        },
        undefined,
        () => {}
      );

      const furniture = new THREE.Mesh(boxGeo, boxMat);
      furniture.position.set(0, (h * scale) / 2, 0);
      furniture.castShadow = true;
      furniture.receiveShadow = true;
      scene.add(furniture);

      let autoRotate = true;
      controls.addEventListener("start", () => { autoRotate = false; });

      function onResize() {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener("resize", onResize);

      function animate() {
        if (cancelled) return;
        requestAnimationFrame(animate);
        if (autoRotate) furniture.rotation.y += 0.003;
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      cleanupRef.current = () => {
        cancelled = true;
        window.removeEventListener("resize", onResize);
        controls.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    init();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, [product, context]);

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in-up">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left — product info */}
        <div className="absolute top-6 left-6 pointer-events-auto bg-card/90 backdrop-blur-sm rounded-xl p-4 border border-border/50 max-w-xs">
          <h3 className="text-lg font-serif text-foreground">{product.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg font-semibold text-foreground">
              ${product.price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              <span className="text-yellow-500">&#9733;</span> {product.rating}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 italic leading-relaxed">
            &ldquo;{product.vibe_note}&rdquo;
          </p>
        </div>

        {/* Top right — back button */}
        <div className="absolute top-6 right-6 pointer-events-auto">
          <Button variant="outline" onClick={onBack} className="rounded-lg bg-card/90 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to room
          </Button>
        </div>

        {/* Bottom right — add to cart */}
        <div className="absolute bottom-8 right-8 pointer-events-auto">
          <Button
            onClick={() => setCartAdded(true)}
            disabled={cartAdded}
            className={`rounded-xl h-12 px-6 font-medium ${
              cartAdded ? 'bg-sage text-primary-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {cartAdded ? (
              <><Check className="w-4 h-4 mr-2" /> Added to Cart</>
            ) : (
              <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
            )}
          </Button>
        </div>

        {/* Bottom left — controls hint */}
        <div className="absolute bottom-8 left-8 bg-card/60 backdrop-blur-sm rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">Drag to orbit &middot; Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
