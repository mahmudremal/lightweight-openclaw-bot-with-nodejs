class Assembler {
  assemble(meta, outline, sections) {
    let html = `<h1>${meta.title}</h1>\n<p><em>${meta.description}</em></p>\n\n`;
    
    sections.forEach(section => {
      html += `<h2>${section.title}</h2>\n`;
      section.blocks.forEach(block => {
        if (block.type === 'header') html += `<h3>${block.content}</h3>\n`;
        else if (block.type === 'list') {
           // Basic list handling - assumes content is a string or array
           if (Array.isArray(block.content)) {
             html += `<ul>${block.content.map(i => `<li>${i}</li>`).join('')}</ul>\n`;
           } else {
             html += `<ul><li>${block.content}</li></ul>\n`;
           }
        }
        else if (block.type === 'image') html += `<figure><img src="${block.src || '#'}" alt="${block.alt || 'Image'}"><figcaption>${block.caption || ''}</figcaption></figure>\n`;
        else html += `<p>${block.content}</p>\n`;
      });
    });
    
    return {
      meta,
      outline,
      sections,
      html
    };
  }
}

export default new Assembler();