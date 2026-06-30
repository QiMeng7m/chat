import { useEffect, useState } from 'react'
import { Card, Col, Row, Spin, Typography } from 'antd'
import { fetchPosts, type Post } from '../api'

const { Title, Paragraph, Text } = Typography

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Title level={2}>你好，这是我的个人网站</Title>
      <Paragraph type="secondary">
        用 React + TypeScript + Vite + Ant Design 做前端，Node.js 做后端。
        在这里记录想法、分享作品。
      </Paragraph>

      <Title level={4} style={{ marginTop: 32 }}>
        最新文章
      </Title>

      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <Row gutter={[16, 16]}>
          {posts.map((post) => (
            <Col xs={24} sm={12} key={post.id}>
              <Card hoverable title={post.title}>
                <Paragraph>{post.summary}</Paragraph>
                <Text type="secondary">{post.createdAt}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
