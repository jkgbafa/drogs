import Foundation
import Vision
import ImageIO
let paths = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! [String]
var output: [String: Any] = [:]
var count = 0
for path in paths {
 autoreleasepool {
  let url = URL(fileURLWithPath: path)
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil), let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [kCGImageSourceCreateThumbnailFromImageAlways:true,kCGImageSourceThumbnailMaxPixelSize:1000,kCGImageSourceCreateThumbnailWithTransform:true] as CFDictionary) else { return }
  let request = VNDetectFaceRectanglesRequest()
  do {
   try VNImageRequestHandler(cgImage: image).perform([request])
   let faces = (request.results ?? []).sorted { $0.boundingBox.width*$0.boundingBox.height > $1.boundingBox.width*$1.boundingBox.height }
   var info: [String: Any] = ["width":image.width,"height":image.height]
   if let face = faces.first {
    let r = face.boundingBox
    info["face"] = [r.minX,1-r.maxY,r.width,r.height]
   }
   output[path] = info
  } catch { output[path] = ["width":image.width,"height":image.height] }
 }
 count += 1
 if count % 250 == 0 { print("Framing \(count) / \(paths.count)"); fflush(stdout) }
}
try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys]).write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
print("Finished framing \(output.count) portraits")
