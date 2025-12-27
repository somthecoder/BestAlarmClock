import { Button, Image, View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

const CameraOpener = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Camera permission is required to take a photo.');
      return;
    }

    const cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true, 
      aspect: [4, 3], 
      quality: 1, 
    });

    if (!cameraResult.canceled) {
      setImageUri(cameraResult.assets[0].uri);
      console.log(cameraResult.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Open Camera" onPress={openCamera} />
      {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: 200, height: 200, marginTop: 20 }} />
      )}
    </View>
  );
};

export default CameraOpener;
