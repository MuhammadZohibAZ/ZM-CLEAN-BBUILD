/**
 * React Native Responsive Screen compatibility layer for Web & Mobile.
 * Provides widthPercentageToDP (wp) and heightPercentageToDP (hp) calculations.
 */

const getViewportWidth = (): number => {
  if (typeof window === "undefined") return 390
  return Math.min(window.innerWidth, 480)
}

const getViewportHeight = (): number => {
  if (typeof window === "undefined") return 844
  return window.innerHeight
}

export const widthPercentageToDP = (widthPercent: string | number): number => {
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent)
  return Math.round((getViewportWidth() * elemWidth) / 100)
}

export const heightPercentageToDP = (heightPercent: string | number): number => {
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent)
  return Math.round((getViewportHeight() * elemHeight) / 100)
}

export const wp = widthPercentageToDP
export const hp = heightPercentageToDP

export const listenOrientationChange = (callbackOrComponent?: any) => {
  if (typeof window === "undefined") return
  const handler = () => {
    if (typeof callbackOrComponent === "function") {
      callbackOrComponent({
        window: { width: getViewportWidth(), height: getViewportHeight() },
      })
    } else if (callbackOrComponent && typeof callbackOrComponent.setState === "function") {
      callbackOrComponent.setState({
        orientation: window.innerWidth < window.innerHeight ? "portrait" : "landscape",
      })
    }
  }
  window.addEventListener("resize", handler)
  window.addEventListener("orientationchange", handler)
}

export const removeOrientationListener = () => {
  // Safety wrapper
}

export default {
  widthPercentageToDP,
  heightPercentageToDP,
  wp,
  hp,
  listenOrientationChange,
  removeOrientationListener,
}
