import { Title } from "solid-start";
import { createEffect, createSignal } from "solid-js";
import JSZip from "jszip";
import "./index.css";
import menta from "/menta.png";

export default function Home() {
  const [files, setFiles] = createSignal<FileList | null>(null);
  const [zipReady, setZipReady] = createSignal(false);
  const zip = new JSZip();

  createEffect(async () => {
    if (!files()) return;

    const fileList = Array.from(files());
    let processedFilesCount = 0;

    for (const file of fileList) {
      const imageURL = URL.createObjectURL(file);
      const image = new Image();

      image.onload = async () => {
        if (image.width !== image.height) {
          console.error(`Image ${file.name} is not square.`);
          return;
        }

        const quadrants = await processImage(image);
        addQuadrantsToZip(quadrants, file.name, zip);
        processedFilesCount++;

        if (processedFilesCount === fileList.length) {
          setZipReady(true);
        }
      };

      image.src = imageURL;
    }
  });

  async function processImage(image: HTMLImageElement) {
    const size = image.width; // or image.height, since it's square
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    ctx!.drawImage(image, 0, 0);

    const quadrants = extractQuadrants(ctx!, size, size);
    return quadrants;
  }

  function extractQuadrants(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    const quadrantSize = { width: width / 2, height: height / 2 };
    const quadrants = [];

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const imageData = ctx.getImageData(
          x * quadrantSize.width,
          y * quadrantSize.height,
          quadrantSize.width,
          quadrantSize.height
        );
        quadrants.push(imageData);
      }
    }

    return quadrants;
  }

  function addQuadrantsToZip(
    quadrants: ImageData[],
    imageName: string,
    zip: JSZip
  ) {
    quadrants.forEach((quadrant, index) => {
      const quadrantCanvas = document.createElement("canvas");
      quadrantCanvas.width = quadrant.width;
      quadrantCanvas.height = quadrant.height;
      quadrantCanvas.getContext("2d")!.putImageData(quadrant, 0, 0);

      quadrantCanvas.toBlob((blob) => {
        const quadrantName =
          imageName.replace(/\.[^/.]+$/, "") + `_quadrant_${index + 1}.png`;
        zip.file(quadrantName, blob);
      });
    });
  }

  function handleDownload() {
    zip.generateAsync({ type: "blob" }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "processed_images.zip";
      link.click();
    });
  }

  return (
    <>
      <h1>Separate midjourney images</h1>
      <div class="centered">
        <input
          type="file"
          accept="image/*"
          multiple
          onchange={(e) => setFiles(e.currentTarget.files)}
        />

        {zipReady() && <button onClick={handleDownload}>Download ZIP</button>}
      </div>

      <a href="https://github.com/mentasuave01" target="_blank">
        <div class="menta">
          <div>
            powered by <div id="mentaText">Mensuave01</div>
          </div>
          <img src={menta}></img>
        </div>
      </a>
    </>
  );
}
