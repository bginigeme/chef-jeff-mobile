import React from 'react'
import { Image, ImageStyle, StyleProp } from 'react-native'

interface ChefHatIconProps {
  size?: number
  style?: StyleProp<ImageStyle>
}

export const ChefHatIcon: React.FC<ChefHatIconProps> = ({ 
  size = 20, 
  style 
}) => {
  return (
    <Image
      source={require('../assets/images/chef-hat-icon.png')}
      style={[
        {
          width: size,
          height: size,
        },
        style
      ]}
      resizeMode="contain"
    />
  )
} 
 
 
 