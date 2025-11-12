import React, { useCallback, useEffect } from "react";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import { S3FolderFromList } from "@/types";

// Type assertion to fix React 19 compatibility issue with react-window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FixedSizeGridTyped = FixedSizeGrid as React.ComponentType<any>;

const HEADER_HEIGHT = 90;
const ROW_HEIGHT = 110;

const ImageRenderer: React.FC<
  GridChildComponentProps<{
    thumbnails: S3FolderFromList[];
    gridRows: number;
    handleImageClick: (item: S3FolderFromList, index: number) => void;
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
      <StorageImage
        path={path}
        alt=""
        style={{
          borderRadius: "10px",
        }}
        onClick={() => handleImageClick(thumbnails[index], index)}
      />
    </div>
  );
};

interface VirtualScrollerProps {
  thumbnails: S3FolderFromList[];
  handleImageClick: (item: S3FolderFromList, index: number) => void;
}
const VirtualScroller: React.FC<VirtualScrollerProps> = ({
  thumbnails = [],
  handleImageClick,
}) => {
  const getFullWidth = () => {
    if (typeof window === "undefined") {
      return 360;
    }
    if (window.innerWidth > 1200) {
      return 1200;
    }
    return window.innerWidth - 20;
  };

  const getGridRows = () => {
    if (typeof window === "undefined") {
      return 10;
    }

    let GRID_ROWS = 10;
    if (window.innerWidth <= 470) {
      GRID_ROWS = 3;
    } else if (window.innerWidth > 470 && window.innerWidth <= 640) {
      GRID_ROWS = 4;
    } else if (window.innerWidth > 640 && window.innerWidth <= 768) {
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
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [handleResize]);

  return (
    <FixedSizeGridTyped
      style={{
        margin: "0 10px",
      }}
      columnCount={gridRows}
      columnWidth={(fullWidth - 20) / gridRows}
      height={
        typeof window !== "undefined" ? window.innerHeight - HEADER_HEIGHT : 0
      }
      rowCount={Math.ceil(thumbnails.length / gridRows)}
      rowHeight={ROW_HEIGHT}
      width={fullWidth}
      itemData={{ thumbnails, handleImageClick, gridRows }}
    >
      {ImageRenderer}
    </FixedSizeGridTyped>
  );
};

export default VirtualScroller;
