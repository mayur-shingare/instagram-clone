"use client"
import { Amplify, Auth } from "aws-amplify";
import awsExports from "../aws-exports";
import "@aws-amplify/ui-react/styles.css";
Amplify.configure({ ...awsExports, ssr: true });
import { Authenticator } from "@aws-amplify/ui-react";
import { AmplifyUser } from "@aws-amplify/ui";
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "./components/navbar";
import { CLOUDFRONT_URL } from "./constants/constants";
import { Hub } from 'aws-amplify';

const IMAGE_URL = CLOUDFRONT_URL;
export default function Home() {
  const [userImages, setUserImages] = useState([])

  const uploadPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, user: AmplifyUser | undefined) => {
    const file = e.target.files?.[0]!
    const filename = file.name
    const fileType = file.type
    const res = await fetch(
      `/api/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: filename,
        fileType: fileType,
        userId: user?.attributes?.sub
      }),
    });
    const { url } = await res.json();
    const upload = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { "Content-Type": fileType }
    })
    if (upload.ok) {
      const record = await fetch(
        `/api/graphql`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "query": `
              mutation createImages($input: CreateImagesInput!) {
                createImages(input: $input) {
                  uuid
                  url
                  createdOn
                }
            }
          `,
          "operationName": "createImages",
          "variables": {
            "input": {
              "userId": user?.attributes?.sub,
              "url": `${user?.attributes?.sub}/${filename}`,
              "uuid": uuidv4(),
              "thumbnailUrl": "",
              "createdOn": new Date().toISOString()
            }
          }
        }),
      });
      const response = await record.json();
      await fetchImages();
    } else {
      console.error('Upload failed.')
    }
  }, []);

  const fetchImages = useCallback(async () => {
    const user = await Auth.currentAuthenticatedUser();
    const record = await fetch(
      `/api/graphql`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "query": "query listImages($filter: TableImagesFilterInput!) {\n\t\tlistImages(filter: $filter) {\n\t\t\titems {\n\t\t\t\turl\n\t\t\t}\n\t\t}\n}",
        "operationName": "listImages",
        "variables": {
          "filter": {
            "userId": {
              "eq": user?.attributes?.sub ?? ''
            }
          }
        }
      }),
    });
    const response = await record.json();
    setUserImages(response?.response?.data?.listImages?.items?.map?.((val: any) => {
      return {
        original: IMAGE_URL + val.url,
        thumbnail: IMAGE_URL + val.url
      }
    }) ?? [])
  }, []);

  const listener = useCallback((data: any) => {
    switch (data.payload.event) {
      case 'signIn':
        fetchImages();
        break;
      default:
        return null;
    }
  }, [])

  useEffect(() => {
    fetchImages();
    Hub.listen('auth', listener);
  }, []);

  return (
    <main>
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            <Navbar signOut={signOut} user={user} />
            <div>
              <div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
                <div className="-m-1 flex flex-wrap md:-m-2">
                  {userImages.map((val: any) => {
                    return <div className="flex w-1/3 flex-wrap" key={val.thumbnail}>
                      <div className="w-full p-1 md:p-2">
                        <img
                          alt="gallery"
                          className="block h-full w-full rounded-lg object-cover object-center"
                          src={val.thumbnail} />
                      </div>
                    </div>
                  })}

                </div>
              </div>
            </div>
            <div className="flex justify-center mt-24">
              <input type="file" accept="image/png, image/jpeg" onChange={(e) => { uploadPhoto(e, user) }} />
            </div>
          </main>
        )}
      </Authenticator>
    </main>
  );
}
