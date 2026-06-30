import { Typography } from 'antd'

const { Title, Paragraph } = Typography

export default function About() {
  return (
    <div>
      <Title level={2}>关于我</Title>
      <Paragraph>
        这里可以写你的自我介绍：背景、兴趣、正在做的事。
      </Paragraph>
      <Paragraph>
        这个页面只是占位，你可以随时改成自己的内容。
      </Paragraph>
    </div>
  )
}
