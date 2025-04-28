import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Pages.module.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { AiFillCloseCircle } from "react-icons/ai";
import "swiper/css";
// import axios from "axios";
// import { fetchAuthSession } from "aws-amplify/auth";
import { Navigation, Pagination } from "swiper/modules";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { list, ListOutputItemWithPath } from "aws-amplify/storage";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";

const API_URL = "https://tllw3d65w2.execute-api.us-east-1.amazonaws.com/dev";

const ImageRenderer: React.FC<
  GridChildComponentProps<ListOutputItemWithPath[]>
> = ({ columnIndex, rowIndex, style, data }) => {
  const index = rowIndex * 5 + columnIndex;
  if (!data[index]) {
    return null;
  }

  const { path } = data[index];

  return (
    <div style={{ ...style, padding: "10px" }}>
      <StorageImage
        path={path}
        alt=""
        className={styles.virtualScrollerImage}
        style={{
          borderRadius: "10px",
        }}
        // onClick={() => handleImageClick(data[index])}
      />
    </div>
  );
};

const Folder: React.FC = () => {
  const router = useRouter();
  const [thumbnails, setThumbnails] = useState<ListOutputItemWithPath[]>();
  const [isSliderMode, setIsSliderMode] = useState(false);
  const [selectedSliderImage, setSelectedSliderImage] = useState<{
    imageKey: string;
    thumbnail: string;
  }>();

  useEffect(() => {
    const listThumbnails = async () => {
      try {
        const thumbnailsResult = await list({
          path: `public/${router.query.folder}/thumbnails`,
        });
        console.log("thumbnailsResult ", thumbnailsResult);
        const sanitizedThumbnails = thumbnailsResult.items.filter(
          (item) => !item.path.endsWith("/")
        );
        setThumbnails(sanitizedThumbnails);
      } catch (error) {
        console.log(error);
      }
    };

    listThumbnails();
  }, [router.query.folder]);

  return (
    <main className={styles.main}>
      <header style={{ margin: "20px" }}>
        <h1>Folder: {router.query.folder}</h1>
      </header>

      {thumbnails && (
        <Grid
          columnCount={5}
          columnWidth={1200 / 5}
          height={window.innerHeight - 70}
          rowCount={thumbnails.length / 5}
          rowHeight={230}
          width={1200}
          itemData={thumbnails}
        >
          {ImageRenderer}
        </Grid>
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
              onSlideChange={() => console.log("slide change")}
              onSwiper={(swiper) => console.log(swiper)}
              centeredSlides={true}
              style={{ textAlign: "center" }}
              modules={[Navigation, Pagination]}
            >
              {selectedSliderImage && (
                <SwiperSlide key={selectedSliderImage.imageKey}>
                  <StorageImage
                    path={selectedSliderImage.imageKey
                      .replace("public/public/", "public/")
                      .replace("thumbnails/", "")}
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
              )}
            </Swiper>
          </div>
        </>
      )}
    </main>
  );
};

export default Folder;
