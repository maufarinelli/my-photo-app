import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Grid, useTheme } from "@aws-amplify/ui-react";
import styles from "@/styles/Pages.module.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { AiFillCloseCircle } from "react-icons/ai";
import "swiper/css";
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import { Navigation, Pagination } from "swiper/modules";

const API_URL = "https://tllw3d65w2.execute-api.us-east-1.amazonaws.com/dev";

// const PAGE_SIZE = 30;
// let nextToken;

const Folder: React.FC = () => {
  const router = useRouter();
  const { tokens } = useTheme();

  // ListPaginateWithPathOutput | undefined
  const [s3ContentInfo, setS3ContentInfo] = useState<string[]>();
  const [isSliderMode, setIsSliderMode] = useState(false);

  useEffect(() => {
    const listObjects = async () => {
      try {
        // const result = await list({
        //   path: `public/${router.query.folder}/`,
        //   options: {
        //     pageSize: PAGE_SIZE,
        //     nextToken,
        //   },
        // });
        // console.log("result ", result);
        const { tokens } = await fetchAuthSession();
        const authToken = tokens?.idToken?.toString();

        const result = await axios.get(
          `${API_URL}/items?route=${router.query.folder}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken,
            },
          }
        );
        console.log("result ", result);
        setS3ContentInfo(result.data);
      } catch (error) {
        console.log(error);
      }
    };

    listObjects();
  }, [router.query.folder]);

  return (
    <main className={styles.main}>
      <header style={{ margin: "20px" }}>
        <h1>Folder: {router.query.folder}</h1>
      </header>

      <Grid className={styles.gridTemplateColumns} gap={tokens.space.small}>
        {s3ContentInfo?.map((item) => {
          return (
            item && (
              <div style={{ textAlign: "center" }} key={item}>
                <img
                  src={`data:image/jpeg;base64, ${item}`}
                  alt={"item"}
                  onClick={() => setIsSliderMode(true)}
                  style={{ borderRadius: "10px" }}
                />
              </div>
            )
          );
        })}
      </Grid>

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
              {s3ContentInfo?.map(
                (item) =>
                  item && (
                    <SwiperSlide key={item}>
                      <img
                        src={`data:image/jpeg;base64, ${item}`}
                        alt={"item"}
                        style={{
                          maxWidth: "95vw",
                          maxHeight: "95vh",
                        }}
                        onClick={() => setIsSliderMode(true)}
                      />
                    </SwiperSlide>
                  )
              )}
            </Swiper>
          </div>
        </>
      )}
    </main>
  );
};

export default Folder;
