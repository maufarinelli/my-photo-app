import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Pages.module.css";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { AiFillCloseCircle } from "react-icons/ai";
import "swiper/css";
import { Navigation, Pagination } from "swiper/modules";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { list, ListOutputItemWithPath } from "aws-amplify/storage";
import VirtualScroller from "./components/VirtualScroller/VirtualScroller";

// const API_URL = "https://tllw3d65w2.execute-api.us-east-1.amazonaws.com/dev";
const PREVIOUS_IMAGES_QTY = 10;
const MINIMUM_IMAGES_QTY_WHEN_10_PREVIOUS_LOADED = PREVIOUS_IMAGES_QTY + 2;

const Folder: React.FC = () => {
  const router = useRouter();
  const [thumbnails, setThumbnails] = useState<ListOutputItemWithPath[]>();
  const [sliderImages, setSliderImages] = useState<ListOutputItemWithPath[]>();
  const [isSliderMode, setIsSliderMode] = useState(false);
  const [loadedSliderImages, setLoadedSliderImages] = useState<
    ListOutputItemWithPath[]
  >([]);
  const [selectedSliderImageIndex, setSelectedSliderImageIndex] =
    useState<number>();
  const [sliderLoadededIndexes, setSliderLoadededIndexes] = useState<number[]>(
    []
  );

  useEffect(() => {
    const listThumbnails = async () => {
      try {
        const thumbnailsResult = await list({
          path: `public/${router.query.folder}/thumbnails`,
        });
        const sanitizedThumbnails = thumbnailsResult.items.filter(
          (item) => !item.path.endsWith("/")
        );
        setThumbnails(sanitizedThumbnails);
        const sliderImages = sanitizedThumbnails.map((item) => ({
          ...item,
          path: item.path.replace("/thumbnails/", "/slider/"),
        }));
        setSliderImages(sliderImages);
      } catch (error) {
        console.log(error);
      }
    };

    listThumbnails();
  }, [router.query.folder]);

  const handleImageClick = (item: ListOutputItemWithPath, index: number) => {
    setSelectedSliderImageIndex(index);

    const imagesToLoad = [sliderImages?.[index]];
    const indexToLoad = [index];

    // To preload the 10 previous images, if available
    if (index !== 0) {
      let indexBackwards = index - 1;
      for (let i = 0; i < PREVIOUS_IMAGES_QTY; i++) {
        indexToLoad.unshift(indexBackwards);
        imagesToLoad.unshift(sliderImages?.[indexBackwards]);
        if (indexBackwards === 0) break;
        indexBackwards--;
      }
    }
    // To preload the next images
    if (sliderImages && index !== sliderImages.length - 1) {
      indexToLoad.push(index + 1);
      imagesToLoad?.push(sliderImages?.[index + 1]);
    }

    setSliderLoadededIndexes(indexToLoad);
    setLoadedSliderImages(imagesToLoad);
    setIsSliderMode(true);
  };

  const handleSlideChange = (swiper: SwiperType) => {
    const { activeIndex, swipeDirection } = swiper;

    if (swipeDirection === "next") {
      const lastIndex = sliderLoadededIndexes[sliderLoadededIndexes.length - 1];

      if (
        sliderImages &&
        activeIndex !== sliderImages?.length - 1 &&
        lastIndex !== sliderImages?.length - 1
      ) {
        const indexToLoad = lastIndex + 1;

        setSliderLoadededIndexes((prev) => {
          const newIndexes = [...prev];
          newIndexes.push(indexToLoad);

          return newIndexes;
        });
        setLoadedSliderImages((prev) => {
          const newImages = [...prev];
          newImages.push(sliderImages?.[indexToLoad]);
          return newImages;
        });
      }
    }
  };

  return (
    <main className={styles.main}>
      <header style={{ margin: "20px" }}>
        <h1>Folder: {router.query.folder}</h1>
      </header>

      {thumbnails && (
        <VirtualScroller
          thumbnails={thumbnails}
          handleImageClick={handleImageClick}
        />
      )}

      {isSliderMode && (
        <>
          <div className={styles.overlay}></div>
          <button
            className={styles.buttonClose}
            onClick={() => setIsSliderMode(false)}
          >
            <AiFillCloseCircle />
          </button>
          <div className={styles.sliderWrapper}>
            <Swiper
              spaceBetween={20}
              slidesPerView={1}
              onSlideChange={handleSlideChange}
              centeredSlides={true}
              style={{ textAlign: "center" }}
              modules={[Navigation, Pagination]}
              initialSlide={
                loadedSliderImages.length >=
                MINIMUM_IMAGES_QTY_WHEN_10_PREVIOUS_LOADED
                  ? 10
                  : selectedSliderImageIndex
              }
            >
              {loadedSliderImages &&
                loadedSliderImages.map((selectedSliderImage) => (
                  <SwiperSlide key={selectedSliderImage.eTag}>
                    <StorageImage
                      path={selectedSliderImage.path}
                      style={{
                        maxWidth: "95vw",
                        maxHeight: "95vh",
                      }}
                      alt={selectedSliderImage.imageKey}
                      loading="lazy"
                      onError={(e) => {
                        console.log("error loading image", e);
                      }}
                    />
                  </SwiperSlide>
                ))}
            </Swiper>
          </div>
        </>
      )}
    </main>
  );
};

export default Folder;
