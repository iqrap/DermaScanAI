"use client"

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, ReactNode } from "react" //  Added ReactNode import
import { View, Text, Alert, StyleSheet } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"

// --- TYPE DEFINITIONS ---

// Define the expected return type for the ref object (Imperative Handle)
export type CameraRef = {
    takePicture: () => Promise<void>;
}

//  Add children property and make other properties more specific
type CustomCameraProps = {
    onCapture: (photo: { uri: string } | null) => void // Corrected 'photo: any' to be more explicit
    style?: object
    cameraStyle?: object
    isFlashOn?: boolean
    cameraType?: "front" | "back"
    children?: ReactNode // Optional overlay rendered above the camera view
}

// ---------------------------

const CustomCamera = forwardRef(
    // Destructure 'children' from props
    ({ onCapture, style, cameraStyle, isFlashOn = false, cameraType = "back", children }: CustomCameraProps, ref: React.ForwardedRef<CameraRef>) => {
        const [permission, requestPermission] = useCameraPermissions()
        const cameraRef = useRef<CameraView | null>(null)
        const [isReady, setIsReady] = useState(false)
        const [isProcessing, setIsProcessing] = useState(false)

        useImperativeHandle(ref, () => ({
            takePicture: async () => {
                if (cameraRef.current && isReady && !isProcessing) {
                    setIsProcessing(true)
                    try {
                        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 })
                        
                        // 💡 Improved check for photo URI
                        if (photo?.uri) {
                            onCapture(photo as { uri: string }) // Cast to conform to the corrected prop type
                        } else {
                            Alert.alert("Error", "Failed to capture photo")
                        }
                    } catch (error) {
                        console.log("[v0] Camera capture error:", error)
                        Alert.alert("Error", "Failed to capture image")
                    } finally {
                        setIsProcessing(false)
                    }
                }
            },
        }))

        useEffect(() => {
            if (!permission) requestPermission()
        }, [permission, requestPermission]) // Added requestPermission to dependency array

        if (!permission) return <View />
        if (!permission.granted) return (
            <View style={styles.center}>
                <Text>No access to camera</Text>
            </View>
        ) 

        return (
            <View style={[styles.container, style]}>
                <CameraView
                    ref={cameraRef}
                    style={[styles.camera, cameraStyle]}
                    facing={cameraType}
                    enableTorch={isFlashOn}
                    onCameraReady={() => setIsReady(true)}
                />

                {/* Render overlay content above the camera without nesting inside CameraView */}
                {children ? <View style={styles.overlay}>{children}</View> : null}
            </View>
        )
    },
)

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: "box-none",
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default CustomCamera
