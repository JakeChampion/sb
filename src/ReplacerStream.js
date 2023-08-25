export class ReplacerStream extends TransformStream {
  constructor(findStr, replaceStr) {
    super({
      transform: async (chunk, controller) => {
        var workingChunk = this.buffer + this.textDecoder.decode(chunk);

        while (workingChunk.includes(findStr)) {
          const pos = workingChunk.indexOf(findStr);
          workingChunk = workingChunk.substring(0, pos) + replaceStr + workingChunk.substring(pos + findStr.length);
        }

        this.buffer = workingChunk.slice(0 - this.bufferLen);
        controller.enqueue(
          this.textEncoder.encode(
            workingChunk.slice(0, workingChunk.length - this.buffer.length)
          )
        );
      },
      flush: (controller) => {
        var workingChunk = this.buffer;

        if (workingChunk === findStr) {
          workingChunk = replaceStr;
        }

        this.buffer = '';
        controller.enqueue(
          this.textEncoder.encode(workingChunk)
        );
      }
    });
    this.textEncoder = new TextEncoder();
    this.textDecoder = new TextDecoder();
    this.buffer = '';
    this.bufferLen = findStr.length;
  }
}
