import axios from "axios";
import { useMemo, useRef, useState } from "react";
import { toast } from "../notifications";

type ContentType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "audio/mpeg"
  | "audio/wav"
  | "video/mp4"
  | "video/mpeg";

interface GetUploadLinkCommand {
  filename: string;
  fileContentType: ContentType;
  contentLength: number;
}

interface Header {
  contentType: string;
  contentLength: number;
}

interface Request {
  header: Header;
  uploadUrl: string;
  visitUrl: string;
}

type GetUploadLinkService = (params: GetUploadLinkCommand) => Promise<Request | undefined>;

let getUploadLink: GetUploadLinkService | undefined;

type Deps = { getUploadLinkService: GetUploadLinkService };

export function init(deps: Deps) {
  getUploadLink = deps.getUploadLinkService;
}
type State = {
  progress: number;
  loading: boolean;
  file?: File;
  previewUrl?: string;
  successful?: boolean;
};

const defaultState: State = {
  progress: 0,
  loading: false,
};

type Config = {
  accept?: string;
};

export function useUpload({ accept = "*" }: Config = {}) {
  const [state, setState] = useState<State>(defaultState);
  const loadingRef = useRef<boolean>(false);
  const fileRef = useRef<File>();
  const { choose, chooseAndUpload, upload } = useMemo(() => {
    const choose = async () => {
      if (getUploadLink === undefined) {
        console.error("get upload link method not fond");
        return;
      }
      if (loadingRef.current) {
        console.error("uploading");
        return;
      }
      const file = await new Promise<File | undefined>((resolve, _reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = (e: Event) => {
          const event = e as any as React.ChangeEvent<HTMLInputElement>;
          const file = event.target.files?.[0];
          resolve(file);
          input.remove();
        };
        input.click();
      });
      if (file) {
        const previewUrl = await new Promise<string>((resolve, _reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
        });
        fileRef.current = file;
        setState((s) => ({ ...s, file, previewUrl }));
      }
      return file;
    };
    const upload = async () => {
      if (getUploadLink === undefined) {
        console.error("get upload link method not fond");
        return;
      }
      if (loadingRef.current) {
        return;
      }
      const file = fileRef.current;
      if (!file) {
        console.error("No file chosen");
        return;
      }
      const param: GetUploadLinkCommand = {
        filename: file.name,
        fileContentType: file.type as ContentType,
        contentLength: file.size as number,
      };
      loadingRef.current = true;
      setState((s) => ({ ...s, loading: true }));
      const props = await getUploadLink(param);
      if (!props) {
        setState((s) => ({ ...s, loading: false, progress: 0, successful: false }));
        loadingRef.current = false;
        console.error("get upload link failed");
        return;
      }
      try {
        const res = await axios(props.uploadUrl, {
          method: "PUT",
          data: file,
          headers: {
            "Content-Type": props.header.contentType,
            // "Content-Length": props.header.contentLength.toString(),
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 0));
            setState((s) => ({ ...s, loading: true, progress }));
          },
        });
        loadingRef.current = false;
        if (res.status < 300) {
          setState((s) => ({ ...s, loading: false, progress: 0, successful: true }));
          return props.visitUrl;
        } else {
          setState((s) => ({ ...s, loading: false, progress: 0, successful: false }));
          toast("File upload failed", { level: "error" });
        }
      } catch (error) {
        setState((s) => ({ ...s, loading: false, progress: 0, successful: false }));
        loadingRef.current = false;
        toast("File upload failed", { level: "error" });
      }
    };

    const chooseAndUpload = async () => {
      try {
        const _file = await choose();
        return await upload();
      } catch (error) {
        console.error(error);
      }
    };
    return { chooseAndUpload, choose, upload };
  }, [accept]);

  return { chooseAndUpload, upload, choose, ...state };
}

export type UseUploadReturn = ReturnType<typeof useUpload>;
