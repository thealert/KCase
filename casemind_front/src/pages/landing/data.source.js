import React from 'react'
import logoImg from './img/atclogo4.png'
import getQueryString from '@/utils/getCookies'
const getCookies = getQueryString.getCookie
export const Banner30DataSource = {
  wrapper: { className: 'banner3' },
  textWrapper: {
    className: 'banner3-text-wrapper',
    children: [
      {
        name: 'slogan',
        className: 'banner3-slogan',
        children: (
          <div>
            <img src={logoImg} className="banner3-logo" />
            <br />
            <span>KCase</span>
          </div>
        ),
      },
      {
        name: 'name',
        className: 'banner3-name',
        children: (
          <span>
            <p>一套敏捷的测试用例管理平台</p>
          </span>
        ),
      },
      {
        name: 'nameEn',
        className: 'banner3-name-en',
        children: (
          <span style={{ color: '#7d899b' }}>
            一站式测试用例解决方案平台
            <br />
            同时支持<span style={{color: "red"}}><b>用例任务执行，用例评审，AI用例生成，历史数据恢复</b></span>等能力
            <br />
            是研发测试伙伴的好助手
          </span>
        ),
      },
      {
        name: 'button',
        className: 'banner3-button',
        children: (
          <span>
            <p>开始使用</p>
          </span>
        ),
        href: getCookies('username')
          ? '/mycasemind-cms/case/caseList/1'
          : `/mycasemind-cms/login?/case/caseList/1`,
      },
    ],
  },
}
export const Footer00DataSource = {
  wrapper: { className: 'home-page-wrapper footer0-wrapper' },
  OverPack: { className: 'home-page footer0', playScale: 0.05 },
  copyright: {
    className: 'copyright',
    children: (
      <span>
        <p>
          <span>©2023 KCase</span>
        </p>
      </span>
    ),
  },
}
