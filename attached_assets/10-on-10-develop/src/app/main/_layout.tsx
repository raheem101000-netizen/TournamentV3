import { Stack } from "expo-router"

const MainLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="tabs">
      <Stack.Screen name="tabs" />
      <Stack.Screen
        name="[serverInfo]"
        options={{
          animation: "fade_from_bottom",
        }}
      />
      <Stack.Screen name="Search" />
    </Stack>
  )
}
export default MainLayout
