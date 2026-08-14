"use client"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from './drawer'
import React, { useState } from 'react'
import { DrawerHeader } from './drawer'

const CreateAccountDrawer = ({children}) => {
    const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle>Are you sure about that?</DrawerTitle>
            </DrawerHeader>
        </DrawerContent>
    </Drawer>
  )
}

export default CreateAccountDrawer
