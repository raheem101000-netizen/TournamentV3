import { useWindowDimensions } from "react-native"

const DESIGN_SCREEN_SIZE = {
  height: 812,
  width: 375,
}

type Diagonal = {
  height: number
  width: number
}

const calculateDiagonal = ({ height, width }: Diagonal) => {
  return Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2))
}

export const useCalculateSizeRatio = () => {
  const { height, width } = useWindowDimensions()

  const designDiagonal = calculateDiagonal(DESIGN_SCREEN_SIZE)
  const windowDiagonal = calculateDiagonal({ height, width })

  const heightRatio = height / DESIGN_SCREEN_SIZE.height
  const widthRatio = width / DESIGN_SCREEN_SIZE.width
  const diagonalRatio = windowDiagonal / designDiagonal

  return {
    heightRatio,
    widthRatio,
    diagonalRatio,
  }
}
