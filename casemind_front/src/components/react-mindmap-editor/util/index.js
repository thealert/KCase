import preview from './preview';
import editInput, { measureTextWidth } from './editInput';
import clipboardRuntime from './clipboard';
//const uuid_short = require('short-uuid');
const ShortUniqueId = require('short-unique-id');
const shortuid = new ShortUniqueId({ length: 10 });

const { nanoid } = require('nanoid');

const getQueryString = (name, search = window.location.search) => {
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  let r = search.substr(1).match(reg);
  if (r !== null) return unescape(r[2]);
  return null;
};
const guid = () => {
  //return (+new Date() * 1e6 + Math.floor(Math.random() * 1e6)).toString(36);
  //return Date.now().toString(36) + Math.random().toString(36).substring(2);
  //return uuid_short.generate();
  // return shortuid.rnd();
  return nanoid(10);
};
const getUsedResource = (nodes) => {
  let usedResource = [];
  for (let i = 0; i < nodes.length; i++) {
    const resource = nodes[i].getData('resource');
    if (resource) usedResource.push(...resource);
  }
  return [...new Set(usedResource)];
};
export { getQueryString, guid, preview, editInput, measureTextWidth, clipboardRuntime, getUsedResource };
