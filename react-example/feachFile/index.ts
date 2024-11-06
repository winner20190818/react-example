import { getUploadLink } from "@/api/interface/basic";
import type { GetProp, UploadProps } from "antd";
type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0] | File;

type IProps = FileType | File;

export const getFileLink = async <T extends IProps>(file: T) => {
  // @ts-ignore
  const param: ClientapiInternal.GetUploadLinkForm = {
    reason: "asset",
    filename: file.name,
    // @ts-ignore
    fileContentType: file.type as ClientapiInternal.GetUploadLinkForm["fileContentType"],
    contentLength: file.size as number,
  };
  const res = await getUploadLink(param);
  return res.data as CommonUpload.Request;
};

export const feachFile = async <T extends IProps>(file: T) => {
  const fileLinkInfo = await getFileLink(file);
  const res = await fetch(fileLinkInfo.uploadUrl, {
    method: "PUT",
    body: file as FileType,
    headers: {
      "Content-Type": fileLinkInfo.header.contentType,
      "Content-Length": fileLinkInfo.header.contentLength.toString(),
    },
  });

  return {
    url: fileLinkInfo.visitUrl,
    name: file.name,
    status: res.status,
  };
};
