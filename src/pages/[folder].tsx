import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Pages.module.css";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { AiFillCloseCircle } from "react-icons/ai";
import "swiper/css";
import { Navigation, Pagination } from "swiper/modules";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { list } from "aws-amplify/storage";
import VirtualScroller from "./components/VirtualScroller/VirtualScroller";
import { getUrl } from "@aws-amplify/storage";
import Header from "./components/Header/Header";
import { S3FolderFromList } from "@/types";

const PREVIOUS_IMAGES_QTY = 10;
const MINIMUM_IMAGES_QTY_WHEN_10_PREVIOUS_LOADED = PREVIOUS_IMAGES_QTY + 2;

const Folder: React.FC = () => {
  const router = useRouter();
  const [thumbnails, setThumbnails] = useState<
    S3FolderFromList[] | undefined
  >();
  const [sliderImages, setSliderImages] = useState<
    S3FolderFromList[] | undefined
  >();
  // sliderVideos is a map of path fetch as key and video url as value
  const [sliderVideos, setSliderVideos] = useState<Map<string, string>>(
    new Map()
  );

  const [isSliderMode, setIsSliderMode] = useState(false);
  const [loadedSliderImages, setLoadedSliderImages] = useState<
    S3FolderFromList[]
  >([]);
  const [selectedSliderImageIndex, setSelectedSliderImageIndex] =
    useState<number>();
  const [sliderLoadededIndexes, setSliderLoadededIndexes] = useState<number[]>(
    []
  );

  const getVideo = useCallback(async (path: string) => {
    try {
      const getUrlResult = await getUrl({
        path,
        options: {
          validateObjectExistence: false, // Check if object exists before creating a URL
          expiresIn: 900, // validity of the URL, in seconds. defaults to 900 (15 minutes) and maxes at 3600 (1 hour)
        },
      });
      return getUrlResult.url.href;
    } catch (err) {
      console.error("Error getting Video: ", err);
    }
  }, []);

  useEffect(() => {
    const listThumbnails = async () => {
      try {
        const thumbnailsResult = await list({
          path: `public/${router.query.folder}/thumbnails`,
        });
        const sanitizedThumbnails = thumbnailsResult.items.filter(
          (item) => !item.path.endsWith("/")
        );
        setThumbnails(sanitizedThumbnails as S3FolderFromList[]);

        const sliderImages = sanitizedThumbnails.map((item) => ({
          ...item,
          path: item.path.replace("/thumbnails/", "/slider/"),
        }));
        setSliderImages(sliderImages as S3FolderFromList[]);

        const sliderVideosPromises = await Promise.allSettled(
          sliderImages.map(async (item) => {
            // -video.png is sufix of video thumbnails, create on the backend
            if (item.path.endsWith("-video.png")) {
              return await {
                path: item.path.replace("-video.png", ".mp4"),
                url: await getVideo(
                  item.path
                    // if it is video, we don't have a mp4 duplicated in the slider folder
                    .replace("/slider/", "/")
                    .replace("-video.png", ".mp4")
                ),
              };
            }
            return undefined;
          })
        );
        const sliderVideos = sliderVideosPromises
          .filter((promise) => promise.status === "fulfilled")
          .map((result) => result.value)
          .reduce((acc, curr) => {
            acc.set(curr?.path ?? "", curr?.url ?? "");
            return acc;
          }, new Map<string, string>());
        setSliderVideos(sliderVideos);
      } catch (error) {
        console.log(error);
      }
    };

    listThumbnails();
  }, [router.query.folder, getVideo]);

  const handleImageClick = (item: S3FolderFromList, index: number) => {
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

    // Transform path of -video.png images (videos thumbnails) to .mp4
    // in order to get the right video from sliderVideos <video <source
    const imagesToLoadTransformed = imagesToLoad
      .filter((image) => image !== undefined)
      .map((image) => {
        if (image.path.endsWith("-video.png")) {
          return {
            ...image,
            path: image.path.replace("-video.png", ".mp4"),
          };
        }
        return image;
      });

    setSliderLoadededIndexes(indexToLoad);
    setLoadedSliderImages(imagesToLoadTransformed);
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
      <Header title={`Folder: ${router.query.folder}`} />

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
                    {selectedSliderImage.path.endsWith(".mp4") ? (
                      <video
                        controls
                        style={{
                          maxWidth: "95vw",
                          maxHeight: "95vh",
                        }}
                      >
                        <source
                          src={sliderVideos.get(selectedSliderImage.path) ?? ""}
                          type="video/mp4"
                        />
                      </video>
                    ) : (
                      <StorageImage
                        path={selectedSliderImage.path}
                        style={{
                          maxWidth: "95vw",
                          maxHeight: "95vh",
                        }}
                        alt={
                          selectedSliderImage.path.split("/").pop() ?? "Image"
                        }
                        loading="lazy"
                        onError={(e) => {
                          console.log("error loading image", e);
                        }}
                      />
                    )}
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
