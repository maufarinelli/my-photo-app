import React, { useCallback, useEffect } from "react";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { ListOutputItemWithPath } from "aws-amplify/storage";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";

const HEADER_HEIGHT = 90;
const ROW_HEIGHT = 110;

const ImageRenderer: React.FC<
  GridChildComponentProps<{
    thumbnails: ListOutputItemWithPath[];
    gridRows: number;
    handleImageClick: (item: ListOutputItemWithPath, index: number) => void;
  }>
> = ({ columnIndex, rowIndex, style, data }) => {
  const { thumbnails, handleImageClick, gridRows } = data;
  const index = rowIndex * gridRows + columnIndex;
  if (!thumbnails[index]) {
    return null;
  }

  const { path } = thumbnails[index];

  return (
    <div style={{ ...style }}>
      {path.endsWith(".mp4") ? (
        <video
          controls
          style={{ borderRadius: "10px" }}
          onClick={() => handleImageClick(thumbnails[index], index)}
        >
          <source src={path} type="video/mp4" />
        </video>
      ) : (
        <StorageImage
          path={path}
          alt=""
          style={{
            borderRadius: "10px",
          }}
          onClick={() => handleImageClick(thumbnails[index], index)}
        />
      )}
    </div>
  );
};

interface VirtualScrollerProps {
  thumbnails: ListOutputItemWithPath[];
  handleImageClick: (item: ListOutputItemWithPath, index: number) => void;
}
const VirtualScroller: React.FC<VirtualScrollerProps> = ({
  thumbnails,
  handleImageClick,
}) => {
  const getFullWidth = () => {
    if (window.innerWidth > 1200) {
      return 1200;
    }
    return window.innerWidth - 20;
  };

  const getGridRows = () => {
    let GRID_ROWS = 10;
    if (window.innerWidth <= 620) {
      GRID_ROWS = 4;
    } else if (window.innerWidth > 620 && window.innerWidth <= 768) {
      GRID_ROWS = 6;
    } else if (window.innerWidth > 768 && window.innerWidth <= 1024) {
      GRID_ROWS = 7;
    } else if (window.innerWidth > 1024 && window.innerWidth <= 1200) {
      GRID_ROWS = 10;
    }
    return GRID_ROWS;
  };

  const [fullWidth, setFullWidth] = React.useState(getFullWidth());
  const [gridRows, setGridRows] = React.useState(getGridRows());

  const handleResize = useCallback(() => {
    const FULL_WIDTH = getFullWidth();
    const GRID_ROWS = getGridRows();
    console.log("FULL_WIDTH", FULL_WIDTH);
    console.log("GRID_ROWS", GRID_ROWS);

    setFullWidth(FULL_WIDTH);
    setGridRows(GRID_ROWS);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <Grid
      columnCount={gridRows}
      columnWidth={(fullWidth - 20) / gridRows}
      height={window.innerHeight - HEADER_HEIGHT}
      rowCount={Math.ceil(thumbnails.length / gridRows)}
      rowHeight={ROW_HEIGHT}
      width={fullWidth}
      itemData={{ thumbnails, handleImageClick, gridRows }}
    >
      {ImageRenderer}
    </Grid>
  );
};

export default VirtualScroller;
