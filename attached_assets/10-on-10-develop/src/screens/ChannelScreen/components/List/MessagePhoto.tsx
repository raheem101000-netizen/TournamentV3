import { Image } from "expo-image"
import { useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { FullScreenIndicator } from "@/components"
import { useThemeColor } from "@/utils/hooks"

type MessagePhotoProps = {
  attachementUrls?: string
  onImagePress: () => void
}

const MESSAGE_IMAGE_SIZE = 120

export const MessagePhoto = ({ attachementUrls, onImagePress }: MessagePhotoProps) => {
  const { colors } = useThemeColor()

  const [imageLoad, setImageLoad] = useState(true)

  if (!attachementUrls) return null

  return (
    <Pressable onPress={onImagePress} style={styles.container}>
      <Image
        style={{ flex: 1 }}
        onLoadEnd={() => setImageLoad(false)}
        source={{ uri: attachementUrls }}
      />
      {imageLoad ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.icon.disabled,
            },
          ]}>
          <FullScreenIndicator />
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    height: MESSAGE_IMAGE_SIZE,
    width: MESSAGE_IMAGE_SIZE,
    alignSelf: "flex-end",
  },
})
