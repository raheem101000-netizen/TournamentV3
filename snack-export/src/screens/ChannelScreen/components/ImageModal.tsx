import { Image } from "expo-image"
import { useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { CustomModalBody, FullScreenIndicator, IconPicker } from "@/components"
import { useThemeColor } from "@/utils/hooks"

type ImageModalProps = {
  imageUrl?: string
  setImageUrl: (imageUrl?: string) => void
}

export const ImageModal = ({ imageUrl, setImageUrl }: ImageModalProps) => {
  const { colors } = useThemeColor()

  const [modalImageLoad, setModalImageLoad] = useState(true)

  const closeModal = () => setImageUrl(undefined)

  return (
    <CustomModalBody visible={!!imageUrl} closeModal={closeModal}>
      <View style={{ height: 400 }}>
        {imageUrl ? (
          <View style={{ flex: 1 }}>
            <Image
              contentFit="contain"
              source={{ uri: imageUrl }}
              style={{ flex: 1 }}
              onLoadEnd={() => setModalImageLoad(false)}
            />
            {modalImageLoad ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}>
                <FullScreenIndicator />
              </View>
            ) : null}
          </View>
        ) : (
          <FullScreenIndicator />
        )}
      </View>
      <Pressable
        hitSlop={4}
        onPress={closeModal}
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          borderRadius: 24,
          padding: 4,
          backgroundColor: colors.icon.accent.default,
        }}>
        <IconPicker icon="XMark" />
      </Pressable>
    </CustomModalBody>
  )
}
